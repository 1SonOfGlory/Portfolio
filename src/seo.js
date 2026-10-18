import {projects} from './content.js';

export const siteUrl='https://jabessomaneportfolio.vercel.app';
export const profile={
  '@type':'Person','@id':siteUrl+'/#jabess-omane',name:'Jabess Omane',alternateName:'digital_griot',
  url:siteUrl+'/',email:'omanijabess47@gmail.com',jobTitle:'AI Research Engineer',
  description:'AI Research Engineer working in machine learning, AI safety, responsible AI, ethics and governance in Accra, Ghana.',
  image:siteUrl+'/assets/portrait.png',
  sameAs:['https://github.com/1SonOfGlory','https://www.linkedin.com/in/jabess-omane-75919b225/']
};
export const pages={
  '/':{title:'Jabess Omane | AI Research Engineer & digital_griot',heading:'Jabess Omane',description:profile.description,paragraphs:['I am Jabess Omane, also known as digital_griot. My work connects machine-learning engineering, AI safety, responsible AI, ethics and governance.',...projects.map(p=>p.title+': '+p.detail)]},
  '/about':{title:'About Jabess Omane | digital_griot',heading:'About Jabess Omane',description:profile.description,paragraphs:['I am Jabess Omane, also known as digital_griot, an AI Research Engineer based in Accra, Ghana. My interests include AI ethics, policy and governance alongside the technical development and evaluation of AI systems.']},
  '/research':{title:'Research & Projects | Jabess Omane',heading:'Research and projects',description:'Explore Jabess Omane’s work in AI safety, accessible AI, explainability and machine learning.',paragraphs:projects.map(p=>p.title+': '+p.detail)}
};
const paths=['/research/representational-imprint','/products/kasa-ai','/research/hexai','/research/decisionlens','/research/fairscore'];
projects.forEach((p,i)=>{pages[paths[i]]={title:p.title+' | Jabess Omane',heading:p.title,description:p.desc,paragraphs:[p.type,p.detail,p.tags]};});
export function pageSchema(path){return {'@context':'https://schema.org','@graph':[profile,{'@type':'WebSite','@id':siteUrl+'/#website',url:siteUrl+'/',name:'Jabess Omane | digital_griot',publisher:{'@id':profile['@id']}},{'@type':path==='/about'?'ProfilePage':'WebPage',url:siteUrl+path,name:pages[path].title,isPartOf:{'@id':siteUrl+'/#website'},about:{'@id':profile['@id']}}]};}
