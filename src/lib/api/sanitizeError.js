/** Never expose API keys or raw provider errors to users */
export function sanitizeErrorMessage(raw) {
  if (!raw || typeof raw !== 'string') return 'Ceva nu a mers bine. Încearcă din nou.';
  let msg = raw.replace(/sk-[a-zA-Z0-9._-]+/gi, 'sk-***');
  if (/openai|401|403|api key|incorrect.*key/i.test(msg)) {
    return 'Scanare AI indisponibilă momentan — citesc eticheta local din poză.';
  }
  if (msg.length > 120) msg = `${msg.slice(0, 120)}…`;
  return msg;
}
