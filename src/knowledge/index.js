/* One searchable index over the Constitution, RTI and government knowledge.
 * "Ask Your Constitution" retrieves the best matching entries and answers only from them,
 * always with references. An optional server side AI step (supabase/functions/ask) can phrase a
 * fuller answer from the same retrieved passages. */
import { ARTICLES, DUTIES, DPSP, PARTS, SCHEDULES, AMENDMENTS, OFFICIAL } from "./constitution.js";
import { RTI_SECTIONS, RTI_FEES, RTI_TIMELINE, RTI_STEPS, RTI_SOURCES } from "./rti.js";
import { LEVELS, KINDS, GOV_SOURCES } from "./government.js";

// Published edits from Admin > Website content > Knowledge base, keyed by entry id.
export const KNOWLEDGE_OVERRIDES = {};
export function applyKnowledge(id, data) { KNOWLEDGE_OVERRIDES[id] = data; }
function merge(doc) {
  const o = KNOWLEDGE_OVERRIDES[doc.id]; if (!o) return doc;
  return { ...doc, title: o.title || doc.title, text: o.summary || doc.text, example: o.example ?? doc.example,
    source: o.source_url ? { label: o.source_label || doc.source.label, url: o.source_url } : doc.source,
    reviewed: o.verified ? (o.verified_on || true) : null };
}
export function buildDocs() { return rawDocs().map(merge); }
// Rows for Website Data Sync: every entry becomes a reviewable draft in the CMS.
export const knowledgeRows = () => rawDocs().map((d) => ({ collection: "knowledge", key: d.id, data: { area: d.type, ref: d.ref, title: d.title, summary: d.text, ...(d.example ? { example: d.example } : {}), source_label: d.source.label, source_url: d.source.url, verified: false } }));
function rawDocs() {
  const d = [];
  ARTICLES.forEach((a) => d.push({ id: a.id, type: a.kind === "right" ? "Fundamental Right" : "Constitution", ref: a.art, title: a.title, text: a.summary, example: a.example, source: a.source, jurisdiction: "All of India", tags: `${a.group}${a.kind === "right" ? " fundamental rights" : ""}` }));
  DUTIES.forEach(([k, t]) => d.push({ id: `duty-${k}`, type: "Fundamental Duty", ref: `Article 51A(${k})`, title: "Fundamental Duty", text: t, source: OFFICIAL.constitution, jurisdiction: "All citizens", tags: "duties duty responsibility" }));
  DPSP.forEach(([art, t]) => d.push({ id: `dpsp-${art.replace(/\D+/g, "") || art}${/A$/.test(art) ? "a" : ""}`, type: "Directive Principle", ref: art, title: "Directive Principle of State Policy", text: t, source: OFFICIAL.constitution, jurisdiction: "Guides Union and State governments; not enforceable in court (Article 37)", tags: "directive principles policy welfare" }));
  PARTS.forEach(([n, t, arts]) => d.push({ id: `part-${n}`, type: "Part of the Constitution", ref: `Part ${n}`, title: t, text: `Part ${n} covers ${t.toLowerCase()} (Articles ${arts}).`, source: OFFICIAL.constitution, jurisdiction: "All of India", tags: "part articles" }));
  SCHEDULES.forEach(([n, t]) => d.push({ id: `sch-${n.toLowerCase()}`, type: "Schedule", ref: `${n} Schedule`, title: `${n} Schedule`, text: t, source: OFFICIAL.constitution, jurisdiction: "All of India", tags: "schedule" }));
  AMENDMENTS.forEach(([n, y, t]) => d.push({ id: `amd-${n}`, type: "Amendment", ref: `${n} Amendment (${y})`, title: `Constitution ${n} Amendment, ${y}`, text: t, source: OFFICIAL.constitution, jurisdiction: "All of India", tags: "amendment" }));
  RTI_SECTIONS.forEach(([s, t, x]) => d.push({ id: `rti-${s.replace(/\W+/g, "").toLowerCase()}`, type: "RTI Act, 2005", ref: s, title: t, text: x, source: RTI_SOURCES.act, jurisdiction: "Central and State public authorities", tags: "rti right to information" }));
  RTI_TIMELINE.forEach(([t, v, x], i) => d.push({ id: `rti-time-${i}`, type: "RTI time limit", ref: "RTI Act, 2005", title: `${t}: ${v}`, text: x, source: RTI_SOURCES.dopt, jurisdiction: "Central and State public authorities", tags: "rti deadline days time limit reply appeal" }));
  RTI_FEES.forEach(([t, v], i) => d.push({ id: `rti-fee-${i}`, type: "RTI fee", ref: "RTI fee rules", title: t, text: v, source: RTI_SOURCES.portal, jurisdiction: i === 5 ? "State public authorities" : "Central public authorities", tags: "rti fee cost payment bpl" }));
  RTI_STEPS.forEach(([t, x], i) => d.push({ id: `rti-step-${i}`, type: "How to file an RTI", ref: `Step ${i + 1}`, title: t, text: x, source: RTI_SOURCES.portal, jurisdiction: "Central and State public authorities", tags: "rti how to file application apply" }));
  LEVELS.forEach((lv) => lv.roles.forEach((r) => d.push({ id: `gov-${r.id}`, type: `${lv.name} · ${KINDS[r.kind][0]}`, ref: r.basis || lv.name, title: r.title, text: `${r.role}${r.services.length ? ` Public services: ${r.services.join("; ")}.` : ""}${r.aka.length ? ` Also called: ${r.aka.join(", ")}.` : ""}`, source: r.basis ? OFFICIAL.constitution : GOV_SOURCES.igodStates, jurisdiction: lv.scope, tags: `government officer ${r.group || ""} ${r.aka.join(" ")}` })));
  return d;
}

// Common Hindi and Hinglish words mapped to English search terms.
const HI = {
  "अधिकार": "rights", "मौलिक": "fundamental", "कर्तव्य": "duty duties", "समानता": "equality", "स्वतंत्रता": "freedom liberty", "जीवन": "life", "शिक्षा": "education",
  "धर्म": "religion", "गिरफ्तार": "arrest", "गिरफ्तारी": "arrest", "पुलिस": "police fir", "सूचना": "information rti", "आरटीआई": "rti", "शुल्क": "fee", "फीस": "fee",
  "अपील": "appeal", "दिन": "days", "मतदान": "vote voting", "वोट": "vote", "बच्चे": "child children", "बाल": "child", "श्रम": "labour", "छुआछूत": "untouchability",
  "संविधान": "constitution", "प्रस्तावना": "preamble", "संशोधन": "amendment", "पंचायत": "panchayat", "सरपंच": "sarpanch", "कलेक्टर": "collector district magistrate",
  "तहसीलदार": "tehsildar", "पटवारी": "patwari village revenue officer", "नगर": "municipal", "संपत्ति": "property", "निजता": "privacy", "भेदभाव": "discrimination",
  "adhikar": "rights", "kartavya": "duty", "shiksha": "education", "suchna": "information rti", "girftar": "arrest", "giraftari": "arrest", "samvidhan": "constitution",
};
const STOP = new Set("a an the is are was what who how can i my me to of in on for and or do does be by with at from it this that about any if under please tell".split(" "));
const norm = (s) => String(s).toLowerCase().replace(/article\s+(\d+[a-z]?)/g, " art$1 ").replace(/section\s+(\d+)/g, " sec$1 ");
export function tokens(s) {
  let t = String(s);
  Object.entries(HI).forEach(([k, v]) => { if (t.toLowerCase().includes(k)) t += ` ${v}`; });
  return norm(t).split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)).map((w) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w));
}

export function makeIndex(docs = buildDocs()) {
  const rows = docs.map((d) => { const tk = tokens(`${d.ref} ${d.title} ${d.title} ${d.text} ${d.tags || ""} ${d.example || ""}`); const tf = {}; tk.forEach((w) => (tf[w] = (tf[w] || 0) + 1)); return { d, tf, len: tk.length }; });
  const df = {}; rows.forEach((r) => Object.keys(r.tf).forEach((w) => (df[w] = (df[w] || 0) + 1)));
  const avg = rows.reduce((s, r) => s + r.len, 0) / rows.length; const N = rows.length;
  return function search(q, k = 5) {
    const qt = [...new Set(tokens(q))]; if (!qt.length) return [];
    const scored = rows.map((r) => {
      let s = 0;
      qt.forEach((w) => { const f = r.tf[w]; if (!f) return; const idf = Math.log(1 + (N - df[w] + 0.5) / (df[w] + 0.5)); s += idf * ((f * 2.2) / (f + 1.2 * (0.25 + 0.75 * (r.len / avg)))); });
      const refTok = tokens(r.d.ref); if (qt.some((w) => /^(art|sec)\d/.test(w) && refTok.includes(w))) s += 8; // exact article or section asked for
      return { doc: r.d, score: s };
    }).filter((x) => x.score > 0.5).sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  };
}

// Builds a referenced answer from retrieved entries only; never adds facts of its own.
export function answer(q, search) {
  const hits = search(q, 4);
  if (!hits.length) return { found: false, text: "I could not find this in the verified knowledge base. Try different words, or check the official sources below.", hits: [] };
  const top = hits[0].doc;
  const related = hits.slice(1).filter((h) => h.score > hits[0].score * 0.35).map((h) => h.doc);
  return { found: true, lead: top, related, hits };
}
export const DISCLAIMER = "This is general information to help you understand your rights, not legal advice. Laws, rules and fees can change and can differ between States. Always check the official source, and consult a lawyer or your District Legal Services Authority (free legal aid) for your specific situation.";
