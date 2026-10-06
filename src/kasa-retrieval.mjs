// Offline, extractive retrieval. No generated account facts or network requests.
export function retrieveAnswer(knowledge, question, language = 'en') {
  const locale = ['en', 'twi', 'hausa', 'pidgin'].includes(language) ? language : 'en';
  const text = question.normalize('NFKC').toLocaleLowerCase().replace(/[’]/g, "'");
  const tokens = new Set(text.match(/[\p{L}\p{N}']+/gu) || []);
  const matches = knowledge.documents.map(doc => ({doc, score: doc.terms.filter(term => tokens.has(term)).length})).filter(hit => hit.score > 0).sort((a, b) => b.score - a.score);
  // Multiple possible intents are handed off instead of silently selecting one.
  const selected = matches.length === 1 ? matches[0].doc : null;
  if (!selected) return {answer: knowledge.fallback[locale], english: knowledge.fallback.en, source: null, handoff: true, reason: matches.length ? 'Multiple topics need clarification' : 'No approved source found'};
  return {answer: selected.answer[locale], english: selected.answer.en, source: {id: selected.id, title: selected.title, section: selected.section}, handoff: Boolean(selected.handoff), reason: selected.handoff ? 'Human support required' : 'Approved passage retrieved'};
}
