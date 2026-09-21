const valid=value=>value&&Number.isFinite(Date.parse(value));
export function firstPublication(doc,releases,now=Date.now()){
 const dates=[doc.firstPublishedAt,...releases.filter(r=>r.draft_id===doc.id&&!r.cancelled).map(r=>r.release_at)].filter(d=>valid(d)&&Date.parse(d)<=now);
 return dates.length?new Date(Math.min(...dates.map(Date.parse))).toISOString():null;
}
export function publicationFeed(posts){
 return posts.map(p=>({...p,published:[p.originalPublishedAt,p.firstPublishedAt,p.published].find(valid)})).sort((a,b)=>(Date.parse(b.published)||0)-(Date.parse(a.published)||0));
}
export function localDateInput(value){
 if(!valid(value))return '';
 const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
