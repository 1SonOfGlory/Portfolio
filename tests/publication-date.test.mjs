import {test} from 'node:test';
import assert from 'node:assert/strict';
import {firstPublication,publicationFeed,localDateInput} from '../src/publication-date.mjs';
test('original dates and first publication survive edits, withdrawal and republication',()=>{
 const original='2020-03-04T10:30:00.000Z',first='2026-01-01T09:00:00.000Z',later='2026-02-01T10:00:00.000Z';
 const doc={id:'one',firstPublishedAt:first,published:later};
 assert.equal(publicationFeed([doc])[0].published,first);
 assert.equal(publicationFeed([{...doc,originalPublishedAt:original}])[0].published,original);
 assert.equal(firstPublication(doc,[]),first);
 assert.equal(firstPublication({id:'one'},[{draft_id:'one',release_at:first},{draft_id:'one',release_at:later}]),first);
 assert.equal(firstPublication({id:'one'},[{draft_id:'one',release_at:'2099-01-01'},{draft_id:'one',release_at:first,cancelled:true}]),null);
 assert.equal(publicationFeed([{id:'old',published:later,originalPublishedAt:original},{id:'new',published:first}])[0].id,'new');
 assert.equal(publicationFeed([{published:first}])[0].published,first);
 assert.equal(localDateInput(''), '');
});
