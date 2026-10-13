/* Website content management.
 * The content built into the code (data.js, legal.js, index.html) is the SOURCE.
 * Website Data Sync imports it into the database; editors publish changes there;
 * the public site applies published changes on top of the built in values, so the
 * site still works exactly as before if the database cannot be reached. */
import { HELPLINES, CHANNELS, CATEGORIES, CONTACT } from "./data.js";
import { LEGAL } from "./legal.js";
import { PAGES } from "./pages.js";
import { knowledgeRows, applyKnowledge } from "./knowledge/index.js";
import { sb, hasSupabase } from "./sb.js";

const clone = (x) => JSON.parse(JSON.stringify(x));
// Snapshot taken at load time, before any database overrides are applied.
const ORIGINAL = { helplines: clone(HELPLINES), channels: clone(CHANNELS), categories: clone(CATEGORIES), contact: clone(CONTACT), legal: clone(LEGAL), pages: clone(PAGES) };

export const SITE = { announcement: null, seo: null };
export const BUILD_ID = typeof __BUILD_ID__ !== "undefined" ? __BUILD_ID__ : "dev";

/* ---------- Editor schemas ---------- */
export const COLLECTIONS = [
  { id: "helplines", name: "Emergency helplines", keyLabel: "Number", canAdd: true, help: "The numbers shown under Help near you. Hide removes a number from the site; Display order sorts them.",
    fields: [["n", "Number", "text"], ["label", "Description", "text"], ["order", "Display order", "number"], ["tone", "Highlight colour (optional)", "color"], ["big", "Show as large tile", "bool"], ["hidden", "Hide from the site", "bool"]] },
  { id: "channels", name: "Official channels", keyLabel: "Channel ID", canAdd: true, help: "Grievance portals and helplines linked from each category and the Official channels section. Always verify numbers and links before publishing.",
    fields: [["name", "Name", "text"], ["note", "Short description", "text"], ["href", "Website link", "url"], ["tel", "Phone number", "text"]] },
  { id: "categories", name: "Feedback categories", keyLabel: "Category ID", canAdd: false, help: "Names, hints, sub types and linked channels for each category. Category IDs are fixed because existing feedback refers to them.",
    fields: [["name", "Name", "text"], ["hint", "Hint", "text"], ["subs", "Sub types (one per line)", "lines"], ["channels", "Linked channel IDs (one per line)", "lines"]] },
  { id: "legal", name: "Legal pages", keyLabel: "Page", canAdd: false, help: "Privacy Policy, Terms and Grievance pages. Have changes reviewed by qualified counsel before publishing.",
    fields: [["title", "Page title", "text"], ["sections", "Sections", "pairs"]] },
  { id: "knowledge", name: "Knowledge base", keyLabel: "Entry", canAdd: false, help: "Constitution, RTI and government explorer entries shown in Know your rights and used by Ask Your Constitution. Check each summary against the linked official source, tick Verified with the date, then publish. Unpublished entries show the built in summary.",
    fields: [["area", "Area", "text"], ["ref", "Reference (article, section or level)", "text"], ["title", "Title", "text"], ["summary", "Plain language summary", "textarea"], ["example", "Daily life example", "textarea"], ["source_label", "Official source name", "text"], ["source_url", "Official source link", "url"], ["verified", "Verified against the official source", "bool"], ["verified_on", "Verified on (date)", "text"]] },
  { id: "site", name: "Site settings", keyLabel: "Setting", canAdd: false, help: "About, What we do and How we help pages, contact details, search engine title and description, and a homepage announcement banner.",
    fields: {
      about: [["title", "Heading", "text"], ["intro", "Introduction", "textarea"], ["items", "Cards (first card is shown larger)", "pairs"]],
      what_we_do: [["title", "Heading", "text"], ["intro", "Introduction", "textarea"], ["items", "Services", "pairs"]],
      how_we_help: [["title", "Heading", "text"], ["intro", "Introduction", "textarea"], ["items", "Steps", "pairs"], ["audiences", "Who we help", "pairs"]],
      contact: [["email", "Support email", "text"], ["city", "Location", "text"], ["site", "Website", "text"]],
      seo: [["title", "Page title (browser tab and search results)", "text"], ["description", "Meta description (about 155 characters)", "textarea"]],
      announcement: [["active", "Show the banner", "bool"], ["text", "Banner text", "textarea"], ["link", "Link (optional)", "url"], ["tone", "Style", "select", ["info", "warning", "success"]]],
    } },
];
export const fieldsFor = (collection, key) => { const c = COLLECTIONS.find((x) => x.id === collection); return Array.isArray(c?.fields) ? c.fields : c?.fields?.[key] || []; };

/* ---------- Sync sources ---------- */
export const SOURCES = [
  { id: "app:data.js", name: "Site content (data.js, pages.js)", detail: "Helplines, official channels, categories, contact details, About, What we do, How we help" },
  { id: "app:legal.js", name: "Legal pages (legal.js)", detail: "Privacy Policy, Terms of Use, Grievance Redressal" },
  { id: "app:knowledge", name: "Knowledge base", detail: "Constitution, RTI and government explorer entries" },
  { id: "site:index.html", name: "Live page metadata", detail: "Title and meta description of www.oneyouthoneindia.com" },
];
export async function sourceRows(id) {
  if (id === "app:data.js") return [
    ...ORIGINAL.helplines.map((h, i) => ({ collection: "helplines", key: h.n, data: { n: h.n, label: h.label, order: i + 1, ...(h.tone ? { tone: h.tone } : {}), ...(h.big ? { big: true } : {}) } })),
    ...Object.entries(ORIGINAL.channels).map(([k, v]) => ({ collection: "channels", key: k, data: v })),
    ...ORIGINAL.categories.map((c) => ({ collection: "categories", key: c.id, data: { name: c.name, hint: c.hint, subs: c.subs, channels: c.channels } })),
    { collection: "site", key: "contact", data: ORIGINAL.contact },
    ...Object.entries(ORIGINAL.pages).map(([k, v]) => ({ collection: "site", key: k, data: v })),
    { collection: "site", key: "announcement", data: { active: false, text: "", link: "", tone: "info" } },
  ];
  if (id === "app:knowledge") return knowledgeRows();
  if (id === "app:legal.js") return Object.entries(ORIGINAL.legal).map(([k, v]) => ({ collection: "legal", key: k, data: v }));
  if (id === "site:index.html") {
    const html = await (await fetch(`/index.html?sync=${Date.now()}`, { cache: "no-store" })).text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    return [{ collection: "site", key: "seo", data: { title: doc.title || "", description: doc.querySelector('meta[name="description"]')?.content || "" } }];
  }
  return [];
}

/* ---------- Apply published content to the live site ---------- */
export function applyCms(rows) {
  const by = (c) => rows.filter((r) => r.collection === c);
  // Helplines: merge by number, allow new numbers, hiding and reordering.
  if (by("helplines").length) {
    const map = new Map(ORIGINAL.helplines.map((h, i) => [h.n, { ...h, order: i + 1 }]));
    by("helplines").forEach((r) => map.set(r.key, { ...(map.get(r.key) || {}), ...r.data }));
    const list = [...map.values()].filter((h) => !h.hidden && h.n && h.label).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
    HELPLINES.splice(0, HELPLINES.length, ...list);
  }
  by("channels").forEach((r) => { CHANNELS[r.key] = { ...(CHANNELS[r.key] || {}), ...r.data }; });
  by("categories").forEach((r) => {
    const c = CATEGORIES.find((x) => x.id === r.key); if (!c) return;
    ["name", "hint"].forEach((f) => { if (typeof r.data[f] === "string" && r.data[f].trim()) c[f] = r.data[f]; });
    ["subs", "channels"].forEach((f) => { if (Array.isArray(r.data[f]) && r.data[f].length) c[f] = r.data[f].filter(Boolean); });
  });
  by("knowledge").forEach((r) => applyKnowledge(r.key, r.data));
  by("legal").forEach((r) => { if (r.data.title && Array.isArray(r.data.sections)) LEGAL[r.key] = r.data; });
  by("site").forEach((r) => {
    if (r.key === "contact") Object.assign(CONTACT, r.data);
    if (PAGES[r.key]) {
      const pg = PAGES[r.key];
      ["title", "intro"].forEach((f) => { if (typeof r.data[f] === "string" && r.data[f].trim()) pg[f] = r.data[f]; });
      ["items", "audiences"].forEach((f) => { if (Array.isArray(r.data[f]) && r.data[f].some(([h]) => h)) pg[f] = r.data[f].filter(([h, t]) => h || t); });
    }
    if (r.key === "announcement") SITE.announcement = r.data;
    if (r.key === "seo") {
      SITE.seo = r.data;
      if (r.data.title) document.title = r.data.title;
      if (r.data.description) document.querySelector('meta[name="description"]')?.setAttribute("content", r.data.description);
    }
  });
}

// Load published content before the public site renders (gives up after 1.5 s and uses built in content).
export async function loadCms() {
  if (!hasSupabase()) return;
  try {
    const q = sb().from("cms_items").select("collection, key, data, status, publish_at").eq("status", "published");
    const res = await Promise.race([q, new Promise((r) => setTimeout(() => r({ data: null, timeout: true }), 1500))]);
    if (res?.data?.length) applyCms(res.data.filter((r) => !r.publish_at || new Date(r.publish_at) <= new Date()));
  } catch { /* keep built in content */ }
}
