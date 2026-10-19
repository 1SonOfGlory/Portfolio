import React from 'react';
import {sourceRepositories, repositoryUrl} from './source-repositories';
import './source-repositories.css';

function RepositoryList({group}) {
  return <ul className="source-list">{sourceRepositories.filter(project => project.group === group).map(project =>
    <li key={project.repo}>
      <h3><a href={repositoryUrl(project.repo)} target="_blank" rel="noreferrer">{project.name}</a></h3>
      <p>{project.scope}</p>
    </li>
  )}</ul>;
}

export default function SourceRepositories() {
  return <section className="source-repositories" id="source-code" aria-labelledby="source-title">
    <span className="eyebrow">SOURCE CODE</span>
    <h2 id="source-title">Read the implementation.</h2>
    <p>Repositories include setup instructions, implementation limits, and the checks performed. These projects range from research code to early prototypes.</p>
    <RepositoryList group="selected"/>
    <details>
      <summary>Earlier prototypes and web projects</summary>
      <RepositoryList group="archive"/>
    </details>
  </section>;
}
