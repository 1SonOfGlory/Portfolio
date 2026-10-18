import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {pages,siteUrl,pageSchema} from '../src/seo.js';

const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const template=await readFile('dist/index.html','utf8');
const nav=Object.entries(pages).map(([path,p])=>`<a href="${path}">${escape(p.heading)}</a>`).join(' · ');
for(const [path,page] of Object.entries(pages)){
  const metadata=`<link rel="canonical" href="${siteUrl+path}"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<meta property="og:type" content="website"/><meta property="og:title" content="${escape(page.title)}"/>
<meta property="og:description" content="${escape(page.description)}"/><meta property="og:url" content="${siteUrl+path}"/>
<meta property="og:image" content="${siteUrl}/assets/portrait.png"/><meta name="twitter:card" content="summary"/>
<script id="profile-schema" type="application/ld+json">${JSON.stringify(pageSchema(path)).replaceAll('<','\\u003c')}</script>`;
  const content=`<main style="max-width:76ch;margin:3rem auto;padding:1rem;font-family:system-ui;line-height:1.6"><nav>${nav}</nav><h1>${escape(page.heading)}</h1>${page.paragraphs.map(p=>`<p>${escape(p)}</p>`).join('')}<p>Contact: <a href="mailto:omanijabess47@gmail.com">omanijabess47@gmail.com</a></p><p><a href="https://github.com/1SonOfGlory">GitHub</a> · <a href="https://www.linkedin.com/in/jabess-omane-75919b225/">LinkedIn</a></p></main>`;
  const html=template.replace(/<title>.*?<\/title>/,`<title>${escape(page.title)}</title>`).replace(/<meta name="description"[^>]*>/,`<meta name="description" content="${escape(page.description)}"/>`).replace('</head>',metadata+'</head>').replace('<div id="root"></div>',`<div id="root">${content}</div>`);
  const directory=path==='/'?'dist':'dist'+path;
  await mkdir(directory,{recursive:true});
  await writeFile(directory+'/index.html',html);
}
await writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(pages).map(path=>`<url><loc>${siteUrl+path}</loc></url>`).join('')}</urlset>\n`);
console.log(`Generated readable HTML, structured data and sitemap for ${Object.keys(pages).length} public pages.`);
