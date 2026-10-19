import React from 'react';
import {repositoryGroups, sourceRepositories, repositoryUrl} from './source-repositories';
import './source-repositories.css';

function RepositoryList({group}) {
  return <ul className="source-list">{sourceRepositories.filter(project => project.group === group).map(project =>
    <li key={project.repo}>
      <h4><a href={repositoryUrl(project.repo)} target="_blank" rel="noreferrer">{project.name}</a></h4>
      <p>{project.scope}</p>
    </li>
  )}</ul>;
}

export default function SourceRepositories() {
  return <section className="source-repositories" id="source-code" aria-labelledby="source-title">
    <span className="eyebrow">SOURCE CODE</span>
    <h2 id="source-title">Read the implementation.</h2>
    <p>Browse research and data-science work, applied systems, and a separate collection of freelance and commercial software. Each repository documents its setup, checks, and limitations.</p>
    {repositoryGroups.map(group => group.collapsed ?
      <details key={group.id}>
        <summary>{group.title}</summary>
        <p>{group.description}</p>
        <RepositoryList group={group.id}/>
      </details> :
      <section className="source-group" key={group.id} aria-labelledby={`source-${group.id}`}>
        <h3 id={`source-${group.id}`}>{group.title}</h3>
        <p>{group.description}</p>
        <RepositoryList group={group.id}/>
      </section>
    )}
  </section>;
}
