import {writeFile} from 'node:fs/promises';
import {repositoryGroups, sourceRepositories, repositoryUrl} from '../src/source-repositories.js';
const sections = repositoryGroups.map(group => `## ${group.title}\n\n${group.description}\n\n${sourceRepositories.filter(p => p.group === group.id).map(p => `- [${p.name}](${repositoryUrl(p.repo)}): ${p.scope}`).join('\n')}`);
await writeFile('PROJECTS.md', '# Project source index\n\nResearch, applied systems, and commercial software by Jabess Omane. Each repository documents its implementation scope and validation.\n\n' + sections.join('\n\n') + '\n');
