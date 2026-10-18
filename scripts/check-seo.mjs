import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {pages,siteUrl} from '../src/seo.js';
const sitemap=await readFile('dist/sitemap.xml','utf8');
for(const [path,page] of Object.entries(pages)){
  const html=await readFile((path==='/'?'dist':'dist'+path)+'/index.html','utf8');
  assert.ok(html.includes(`<link rel="canonical" href="${siteUrl+path}"/>`),path+' canonical');
  assert.ok(html.includes('<h1>'),path+' readable content');
  assert.ok(html.includes('omanijabess47@gmail.com'),path+' public email');
  assert.ok(!html.includes('596638609'),path+' no phone');
  assert.ok(html.includes('google-site-verification'),path+' verification');
  const schema=JSON.parse(html.match(/<script id="profile-schema" type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.equal(schema['@graph'][0].name,'Jabess Omane');
  assert.equal(schema['@graph'][2].url,siteUrl+path);
  assert.ok(sitemap.includes(`<loc>${siteUrl+path}</loc>`),path+' in sitemap');
}
assert.ok((await readFile('dist/robots.txt','utf8')).includes('Sitemap: '+siteUrl+'/sitemap.xml'));
console.log('Validated all 8 static pages, JSON-LD, canonicals, verification tag, email privacy, robots.txt and sitemap.');
