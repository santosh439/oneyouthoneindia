// Pure helpers for the ask function (unit tested in tests/ask.test.mjs).
export type Passage = { id: string; ref: string; title: string; text: string; source: string; jurisdiction: string };

export function buildPrompt(question: string, passages: Passage[]) {
  const ctx = passages.map((p, i) => `[${i + 1}] ${p.ref}: ${p.title}\n${p.text}\nApplies to: ${p.jurisdiction}\nOfficial source: ${p.source}`).join("\n\n");
  const system = [
    "You help Indian citizens understand their constitutional rights, the Right to Information Act and how government offices work.",
    "Answer ONLY from the numbered passages provided. If they do not answer the question, say so and suggest checking the official source.",
    "Cite passages in square brackets like [1] after each claim. Mention who it applies to (jurisdiction) where relevant.",
    "Be clear that this is general information, not legal advice, and that rules can differ between States.",
    "Reply in the same language as the question (for example Hindi if the question is in Hindi). Keep it under 180 words. Use plain sentences, no headings.",
  ].join(" ");
  return { system, user: `Passages:\n\n${ctx}\n\nQuestion: ${question}` };
}

export function validate(body: any): { question: string; passages: Passage[] } | string {
  const question = String(body?.question ?? "").trim();
  if (question.length < 3 || question.length > 300) return "Question must be 3 to 300 characters";
  const passages = Array.isArray(body?.passages) ? body.passages.slice(0, 6) : [];
  if (!passages.length) return "No passages";
  for (const p of passages) {
    if (typeof p?.text !== "string" || p.text.length > 2000) return "Invalid passage";
    if (typeof p?.source !== "string" || !/^https:\/\/([a-z0-9-]+\.)*(gov|nic)\.in(\/|$)/i.test(p.source)) return "Passages must come from official sources";
  }
  return { question, passages };
}
