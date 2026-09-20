# Jabess Omane — research portfolio and journal

Academic work leads the homepage. The site includes project case studies, school-project galleries, a course history, an animated resource library, professional credentials, achievements and a separate journal.

## Run locally

Use Node 24 or later. Run `npm ci`, then `npm run dev`. Open http://127.0.0.1:5530. The local studio saves to `data/journal.sqlite`; it is bound to this computer and is not a public production server. `npm run build` builds the deployable Vite site. `npm test` checks local durability and the cloud schema using an isolated PostgreSQL engine.

## Writing

Open `/studio`. New pieces autosave privately. Add a cover, category, excerpt, and source links with optional thumbnails. Preview before publishing. Publishing creates a snapshot: further draft edits stay private. A future release becomes visible when the server clock reaches its scheduled time, without a paid scheduling service. Cancel a schedule or unpublish without deleting the private draft.

Seven-minute drills have a timer, focus mode and a private original-session copy. Revision history can restore an earlier version into a new revision. Export backups regularly; import supports the exported drafts. A Milestone appears on About when published and is excluded from the journal feed.

Five earlier pieces were imported into local private drafts. `private-backup/cloud-drafts.json` is the private migration backup. It is excluded from Git, deployment uploads and the Vite output. The labelled studio walkthrough draft is test content and should not be published. Academic documents are available by email request, not through a document portal.

## Cloud setup

Supabase Free project: `uvdvykjgiftwmbonaarc` (Jabess Journal). The schema in `supabase/schema.sql` was applied successfully through the dashboard. Tables are in a private schema with RLS enabled and no anonymous table access. Only owner UUIDs in `journal_private.owners` may call `journal_admin`. `journal_feed` returns due publication snapshots and strips private drill originals.

1. Invite the owner email through Authentication > Users. Add that user's UUID to `journal_private.owners` using the statement at the bottom of `schema.sql`.
2. Configure the site URL and allowed redirect URLs to the final `/studio` URL and the local preview `/studio` URL.
3. Copy the project URL and **publishable/anon** key into `.env.local` using `.env.example`. Never use a service-role key in `VITE_*` variables.
4. Sign in through the studio, then import the private drafts backup. Check anonymous feed access and owner draft access before deploying.

The Free plan has quotas and can pause after low activity. It is not unlimited storage or an uptime guarantee. No paid add-ons or subscriptions are needed for this implementation. See https://supabase.com/pricing and https://supabase.com/docs/guides/platform/free-project-pausing (checked 19 September 2026).

## Content provenance

Project descriptions and seven training entries come from the corrected research CV and project source notes in `graduate-application-pack`. The 22 library entries and two school projects were restored from the previous portfolio. Study is not labelled as certification. DecisionLens uses a proxy outcome and assumed causal scenarios; no unverified accuracy, fairness or real-world recourse results are claimed. Spider Publishing and Thinking About Thinking roles were confirmed by the user.

Photos are from the existing portfolio. `journal-still-life.png` is an AI-assisted editorial illustration; it is identified as such in its caption. Linked videos use thumbnail previews and open at their source, with no full playback on this site.

## Deployment

The existing GitHub repository is `1SonOfGlory/Portfolio`, linked by the user to Vercel. The currently authenticated Vercel CLI account is Free Hands Creative Media and does not contain this portfolio. Use the existing repository's linked deployment rather than creating a replacement project in that account. An isolated clone is staged in `../portfolio-release`.

The redesign is not live until that repository is updated and Vercel reports a successful production deployment. Never copy `data`, `.env.local`, `.npm-cache`, or `private-backup` into public assets. Build output was checked for private PDF, DOCX, SQLite and SQL files.
