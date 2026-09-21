// PostgreSQL JSONB may return object keys in a different order.
function canonical(value){
 if(Array.isArray(value))return value.map(canonical);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,canonical(value[k])]));
 return value;
}
export function draftSignature(draft){
 const {revision,updated,...content}=draft;
 return JSON.stringify(canonical(content));
}
