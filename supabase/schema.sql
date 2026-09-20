-- Jabess Journal: private writing, immutable publication snapshots.
-- Run once in the Supabase SQL editor. No paid extensions or cron required.
create schema if not exists journal_private;
revoke all on schema journal_private from public, anon, authenticated;

create table if not exists journal_private.owners (
  user_id uuid primary key references auth.users(id)
);
create table if not exists journal_private.drafts (
  id uuid primary key, doc jsonb not null, revision integer not null,
  updated timestamptz not null default now()
);
create table if not exists journal_private.revisions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references journal_private.drafts(id),
  doc jsonb not null, created timestamptz not null default now()
);
create table if not exists journal_private.releases (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references journal_private.drafts(id),
  doc jsonb not null, release_at timestamptz not null,
  created timestamptz not null default now(), cancelled boolean not null default false
);
create index if not exists journal_release_due on journal_private.releases(release_at desc) where not cancelled;
create index if not exists journal_revision_history on journal_private.revisions(draft_id,created desc);
alter table journal_private.owners enable row level security;
alter table journal_private.drafts enable row level security;
alter table journal_private.revisions enable row level security;
alter table journal_private.releases enable row level security;
revoke all on all tables in schema journal_private from public, anon, authenticated;

create or replace function public.journal_feed()
returns jsonb language sql stable security definer set search_path = '' as $$
 select coalesce(jsonb_agg(
  (r.doc - array['drillOriginal','drillCompleted','revision','updated'])
   || jsonb_build_object('published',r.release_at)
  order by r.release_at desc),'[]'::jsonb)
 from (
  select distinct on (draft_id) doc,release_at from journal_private.releases
  where not cancelled and release_at <= now()
  order by draft_id,release_at desc,created desc,id desc
 ) r;
$$;

create or replace function public.journal_admin(operation text, payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
 d journal_private.drafts%rowtype;
 key uuid;
 value jsonb;
 ver integer;
 stamp timestamptz := clock_timestamp();
 due timestamptz;
 result jsonb;
begin
 if auth.uid() is null or not exists (
  select 1 from journal_private.owners where user_id = auth.uid()
 ) then raise exception 'This studio is available only to its owner.' using errcode='42501'; end if;

 if operation='list' then
  select coalesce(jsonb_agg(doc order by updated desc),'[]'::jsonb) into result from journal_private.drafts;
  return result;
 elsif operation='releases' then
  select coalesce(jsonb_agg(to_jsonb(r) order by release_at desc),'[]'::jsonb) into result
  from journal_private.releases r where not cancelled;
  return result;
 elsif operation='export' then
  return jsonb_build_object(
   'drafts',(select coalesce(jsonb_agg(doc),'[]'::jsonb) from journal_private.drafts),
   'revisions',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from journal_private.revisions r),
   'releases',(select coalesce(jsonb_agg(to_jsonb(r)),'[]'::jsonb) from journal_private.releases r));
 end if;

 key := coalesce(nullif(payload->>'id','')::uuid,gen_random_uuid());
 -- Serialize writes to the same draft, including simultaneous first saves.
 perform pg_advisory_xact_lock(hashtextextended(key::text,0));
 select * into d from journal_private.drafts where id=key for update;

 if operation='save' then
  if jsonb_typeof(payload)<>'object' or octet_length(payload::text)>2500000 then
   raise exception 'Invalid or oversized draft.';
  end if;
  if d.id is not null and coalesce((payload->>'revision')::integer,0)<>d.revision then
   raise exception 'A newer version exists. Reload this draft before saving. Your recovery copy is still on this device.' using errcode='40001';
  end if;
  ver:=coalesce(d.revision,0)+1;
  value:=payload||jsonb_build_object('id',key,'revision',ver,'updated',stamp);
  insert into journal_private.drafts(id,doc,revision,updated) values(key,value,ver,stamp)
   on conflict(id) do update set doc=excluded.doc,revision=excluded.revision,updated=excluded.updated;
  insert into journal_private.revisions(draft_id,doc,created) values(key,value,stamp);
  -- Keep the 40 most recent recovery revisions to fit the free storage budget.
  delete from journal_private.revisions where draft_id=key and id not in (
   select id from journal_private.revisions where draft_id=key order by created desc,id desc limit 40
  );
  return value;
 elsif operation='history' then
  select coalesce(jsonb_agg(to_jsonb(r) order by created desc),'[]'::jsonb) into result
  from (select * from journal_private.revisions where draft_id=key order by created desc limit 40) r;
  return result;
 elsif operation='publish' then
  if d.id is null then raise exception 'Save the draft first.'; end if;
  if coalesce((payload->>'revision')::integer,0)<>d.revision then raise exception 'Draft changed. Review and save before publishing.'; end if;
  if coalesce(trim(d.doc->>'title'),'')='' or coalesce(trim(regexp_replace(d.doc->>'body','<[^>]*>','','g')),'')='' then
   raise exception 'A title and some writing are required.';
  end if;
  due:=coalesce(nullif(payload->>'release_at','')::timestamptz,stamp);
  update journal_private.releases set cancelled=true where draft_id=key and release_at>stamp;
  insert into journal_private.releases(draft_id,doc,release_at,created)
   values(key,d.doc||jsonb_build_object('slug',key),due,stamp);
  return jsonb_build_object('release_at',due);
 elsif operation='cancel' then
  update journal_private.releases set cancelled=true where draft_id=key and release_at>stamp;
  return '{"ok":true}'::jsonb;
 elsif operation='unpublish' then
  update journal_private.releases set cancelled=true where draft_id=key;
  return '{"ok":true}'::jsonb;
 end if;
 raise exception 'Unknown action';
end;
$$;

revoke all on function public.journal_feed() from public;
revoke all on function public.journal_admin(text,jsonb) from public,anon;
grant execute on function public.journal_feed() to anon,authenticated;
grant execute on function public.journal_admin(text,jsonb) to authenticated;

-- After inviting the owner's verified email in Authentication > Users:
-- insert into journal_private.owners(user_id)
-- select id from auth.users where email='omanijabess47@gmail.com'
-- on conflict do nothing;
