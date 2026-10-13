import React from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import './home-projects.css';

const featured = [
 {name:'DecisionLens',label:'EXPLAINABLE MACHINE LEARNING',title:'Beyond a prediction. A path forward.',description:'Exploring how an admissions prediction can become understandable, cost-aware alternatives for an applicant.',url:'/research/decisionlens',kind:'decision',visual:<><span>PREDICTION → EXPLANATION → ALTERNATIVES</span><strong>What could<br/>change the outcome?</strong><small>Counterfactual explanations · Algorithmic recourse</small></>},
 {name:'The Representational Imprint',label:'LANGUAGE-MODEL RESEARCH · IN PROGRESS',title:'What survives an AI correction?',description:'Separating weaker associations from a changed pattern—and studying what happens when training continues.',url:'/research/representational-imprint',kind:'imprint',visual:<><span>THE PATTERN. THE STRENGTH.</span><strong>A better score.<br/>A deeper question.</strong><small>Two pilot runs · Explore the evidence and limits</small></>},
 {name:'Kasa AI',label:'ACCESSIBLE AI · INTERACTIVE DEMO',title:'Good support. In your own language.',description:'Voice-first customer care designed for familiar languages and basic phones, without mobile internet on the caller’s phone.',url:'/products/kasa-ai',kind:'kasa',visual:<><span>TWI · HAUSA · PIDGIN</span><strong>Akwaaba.</strong><small>Personalised customer care · Voice-first design</small></>}
];

export default function HomeProjects(){return <section className="wrap home-projects"><div className="section-heading"><div><span className="eyebrow">SELECTED PROJECTS & RESEARCH</span><h2>Questions turned into work.</h2></div><Link className="text-link" to="/research">All work <ArrowUpRight size={17}/></Link></div><div className="home-project-grid">{featured.map(p=><Link key={p.name} to={p.url} className="home-project-card"><div className={'home-project-art '+p.kind} aria-hidden="true">{p.visual}</div><div className="home-project-copy"><span className="eyebrow">{p.label}</span><h3>{p.name}</h3><h4>{p.title}</h4><p>{p.description}</p><span className="home-project-cta">{p.kind==='kasa'?'Explore the demo':'Explore the project'} <ArrowUpRight size={17}/></span></div></Link>)}</div></section>}
