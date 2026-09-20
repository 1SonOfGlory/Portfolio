import {createClient} from '@supabase/supabase-js';
export const cloud=!!(import.meta.env.VITE_SUPABASE_URL&&import.meta.env.VITE_SUPABASE_ANON_KEY);
export const supabase=cloud?createClient(import.meta.env.VITE_SUPABASE_URL,import.meta.env.VITE_SUPABASE_ANON_KEY):null;
const staticProduction=import.meta.env.PROD&&!cloud&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname);
async function local(path,body){const r=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('The writing service is not connected. Your public site is available, but the private studio needs its database configured.');const d=await r.json();if(!r.ok)throw new Error(d.error||'Request failed');return d;}
export async function feed(){if(staticProduction)return [];if(!cloud)return local('feed');const {data,error}=await supabase.rpc('journal_feed');if(error)throw error;return data||[];}
export async function admin(action,payload={}){if(!cloud)return local('admin/'+action,payload);const {data,error}=await supabase.rpc('journal_admin',{operation:action,payload});if(error)throw error;return data;}
export async function login(email){if(!cloud)return local('local-session',{});const {error}=await supabase.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+'/studio',shouldCreateUser:false}});if(error)throw error;return {email:true};}
export async function logout(){if(cloud)await supabase.auth.signOut();else await local('logout',{});}
export async function status(){if(cloud)return {mode:'cloud'};if(staticProduction)throw new Error('The private studio is awaiting its cloud connection. Drafts remain available in the local studio on your computer.');return local('status');}
