import { officialOrgRows } from "../directory.js";
/* DEMO ONLY. An in-browser stand in for Supabase so the preview can show the user
 * dashboard, admin portal and CMS without a real database. It follows the same
 * visibility and permission rules as the SQL migrations. Never used in production. */
const URL_BASE = "https://demo.supabase.co";
const KEY = "oyoi-demo-db-v6";
export const PERSONAS = [
  { id: "00000000-0000-0000-0000-0000000000a1", name: "Aarav (citizen)", display: "Aarav", role: "citizen", email: "aarav@example.in" },
  { id: "00000000-0000-0000-0000-0000000000a5", name: "Sana (super admin)", display: "Sana", role: "super_admin", email: "sana@example.in" },
  { id: "00000000-0000-0000-0000-0000000000a3", name: "Kiran (state admin, Karnataka)", display: "Kiran", role: "state_admin", scope_state: "Karnataka", email: "kiran@example.in" },
  { id: "00000000-0000-0000-0000-0000000000a4", name: "Meera (content manager)", display: "Meera", role: "content_manager", email: "meera@example.in" },
  { id: "00000000-0000-0000-0000-0000000000a6", name: "Ravi (organisation representative)", display: "Ravi", role: "org_rep", email: "ravi@example-fibre.in" },
  { id: "", name: "Signed out visitor", role: "guest" },
];
const OTHERS = [["00000000-0000-0000-0000-0000000000b1", "Priya"], ["00000000-0000-0000-0000-0000000000b2", "Rahul"], ["00000000-0000-0000-0000-0000000000b3", "Fatima"], ["00000000-0000-0000-0000-0000000000b4", "Joseph"]];
const now = () => new Date().toISOString();
const daysAgo = (d, h = 10) => { const t = new Date(); t.setDate(t.getDate() - d); t.setHours(h, (d * 7) % 60, 0, 0); return t.toISOString(); };
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "x" + Math.random().toString(16).slice(2) + Date.now().toString(16));

function seed() {
  const db = { organizations: [], org_reps: [], org_responses: [], rti_requests: [], city_survey: [], profiles: [], profile_details: [], posts: [], post_events: [], notifications: [], votes: [], cms_items: [], cms_revisions: [], sync_runs: [], audit_log: [], users: [], seq: 1001, ev: 1 };
  PERSONAS.filter((p) => p.id).forEach((p, i) => { db.profiles.push({ id: p.id, display_name: p.display, role: p.role, scope_state: p.scope_state || null, scope_district: null, active: true, created_at: daysAgo(60 - i) }); db.users.push({ id: p.id, email: p.email, created_at: daysAgo(60 - i), last_sign_in_at: daysAgo(i) }); });
  OTHERS.forEach(([id, n], i) => { db.profiles.push({ id, display_name: n, role: "citizen", scope_state: null, scope_district: null, active: true, created_at: daysAgo(50 - i) }); db.users.push({ id, email: `${n.toLowerCase()}@example.in`, created_at: daysAgo(50 - i), last_sign_in_at: daysAgo(3 + i) }); });
  [["Aarav Sharma", "Male", 24], ["Sana Qureshi", "Female", 38], ["Kiran Gowda", "Male", 45], ["Meera Iyer", "Female", 31]].forEach(([full_name, gender, age], i) => db.profile_details.push({ id: PERSONAS[i].id, full_name, gender, age, updated_at: daysAgo(30) }));
  const A = PERSONAS[0].id, K = PERSONAS[2].id, S = PERSONAS[1].id;
  const P = [
    [A, "issue", "roads", "MG Road near Trinity metro", "Bengaluru", "Bengaluru Urban", "Karnataka", "Deep pothole outside metro exit", "A deep pothole right outside the metro exit floods every evening and two scooters have skidded this week.", "High", null, 1, "In progress", "approved", K, "BBMP ward engineer has scheduled resurfacing for this week."],
    [A, "issue", "water", "Koramangala 5th Block", "Bengaluru", "Bengaluru Urban", "Karnataka", "No water supply for three days", "Our lane has had no Cauvery water supply for three days and tankers are charging double.", "Critical", null, 4, "Acknowledged", "approved", null, null],
    [A, "review", "health", "Primary Health Centre Jayanagar", "Bengaluru", "Bengaluru Urban", "Karnataka", "Quick and caring treatment", "Doctors saw my mother within twenty minutes and medicines were available free of cost.", null, 5, 12, "Resolved", "approved", null, "Thank you for the feedback. Shared with the PHC staff."],
    [A, "issue", "power", "HSR Layout Sector 2", "Bengaluru", "Bengaluru Urban", "Karnataka", "Streetlights off for a week", "Six streetlights on 27th Main have been off for a week, making the road unsafe at night.", "Medium", null, 0, "Open", "pending", null, null],
    [A, "issue", "corruption", "Sub registrar office", "Bengaluru", "Bengaluru Urban", "Karnataka", "Asked to pay extra for registration", "An agent outside the office said the registration would only move if I paid an extra amount.", "High", null, 20, "Rejected", "rejected", null, "Please file this with the Lokayukta helpline with any evidence you have."],
    [A, "review", "transport", "Majestic bus stand", "Bengaluru", "Bengaluru Urban", "Karnataka", "Clean and well run", "Platforms are clean, announcements are clear and buses ran on time.", null, 4, 7, "Closed", "approved", null, null],
    ["00000000-0000-0000-0000-0000000000b1", "issue", "roads", "Western Express Highway", "Mumbai", "Mumbai Suburban", "Maharashtra", "Broken divider causing accidents", "The divider near the flyover is broken and vehicles cut across dangerously.", "High", null, 3, "Assigned", "approved", S, null],
    ["00000000-0000-0000-0000-0000000000b2", "issue", "municipal", "Ward 112 office", "Pune", "Pune", "Maharashtra", "Garbage not collected", "Garbage has not been collected for five days on our street.", "Medium", null, 2, "Open", "pending", null, null],
    ["00000000-0000-0000-0000-0000000000b3", "review", "education", "Government school Lajpat Nagar", "New Delhi", "South East Delhi", "Delhi", "Excellent new science lab", "The new science lab has changed how children learn. Teachers are motivated.", null, 5, 9, "Resolved", "approved", null, null],
    ["00000000-0000-0000-0000-0000000000b4", "issue", "water", "Anna Nagar", "Chennai", "Chennai", "Tamil Nadu", "Sewage overflow on main road", "Sewage has been overflowing onto the main road for two days.", "Critical", null, 1, "In progress", "approved", S, null],
    ["00000000-0000-0000-0000-0000000000b1", "issue", "police", "Indiranagar police station", "Bengaluru", "Bengaluru Urban", "Karnataka", "Complaint not registered", "I tried to register a theft complaint but was told to come back later twice.", "High", null, 18, "Open", "pending", null, null],
    ["00000000-0000-0000-0000-0000000000b2", "review", "banking", "State Bank branch Hazratganj", "Lucknow", "Lucknow", "Uttar Pradesh", "Helpful staff for pension", "Staff helped my grandfather update his life certificate quickly.", null, 4, 15, "Closed", "approved", null, null],
    ["00000000-0000-0000-0000-0000000000b3", "issue", "transport", "Howrah station", "Howrah", "Howrah", "West Bengal", "Escalator out of order", "The escalator at platform 9 has been out of order for a month.", "Medium", null, 30, "Acknowledged", "approved", null, null],
    ["00000000-0000-0000-0000-0000000000b4", "issue", "health", "District hospital Mysuru", "Mysuru", "Mysuru", "Karnataka", "Long wait at OPD", "Patients wait over four hours at the OPD with no seating.", "Medium", null, 6, "Assigned", "approved", K, null],
    ["00000000-0000-0000-0000-0000000000b1", "issue", "roads", "MG Road near Trinity metro", "Bengaluru", "Bengaluru Urban", "Karnataka", "Pothole at metro exit again", "The pothole outside the metro exit is back and getting bigger.", "High", null, 0, "Open", "pending", null, null],
  ];
  P.forEach(([author, type, cat, entity, city, district, state, title, body, severity, rating, d, status, publication, assigned, response]) => {
    const id = uuid(), created = daysAgo(d, 9 + (db.seq % 8));
    const p = { id, author_id: author, type, cat, sub: null, entity, city, tehsil: null, district, state, rating, severity, title, body, anon: false, visibility: "public", status, hidden: false, response, response_at: response ? daysAgo(Math.max(0, d - 1)) : null, sample: false, created_at: created, evidence: [], lang: null, ref_no: `OYOI-${new Date().getFullYear()}-${String(db.seq++).padStart(6, "0")}`, publication, assigned_to: assigned, withdrawn: false, updated_at: daysAgo(Math.max(0, d - 1), 15) };
    db.posts.push(p);
    const ev = (kind, from, to, reason, actor, dd) => db.post_events.push({ id: db.ev++, post_id: id, actor, kind, from_value: from, to_value: to, reason, created_at: dd });
    ev("created", null, "Open", null, author, created);
    if (publication !== "pending") ev("publication", "pending", publication, publication === "approved" ? "Checked for personal data" : "Outside platform scope", K, daysAgo(Math.max(0, d - 0.5), 12));
    const path = { Acknowledged: ["Acknowledged"], Assigned: ["Acknowledged", "Assigned"], "In progress": ["Acknowledged", "Assigned", "In progress"], Resolved: ["Acknowledged", "In progress", "Resolved"], Closed: ["Acknowledged", "Resolved", "Closed"], Rejected: ["Rejected"] }[status] || [];
    let prev = "Open";
    path.forEach((s, i) => { ev("status", prev, s, i === path.length - 1 && s === "In progress" ? "Work order issued to contractor" : s === "Resolved" ? "Issue confirmed fixed" : null, K, daysAgo(Math.max(0, d - i - 0.6), 13 + i)); prev = s; });
    if (response) ev("response", null, response, null, K, daysAgo(Math.max(0, d - 1), 16));
    if (author === A && path.length) db.notifications.push({ id: db.ev++, user_id: A, post_id: id, title: `${p.ref_no}: status is now ${status}`, body: title, read: d > 5, created_at: daysAgo(Math.max(0, d - 1), 17) });
  });
  // Sample City Survey answers from simulated respondents (demo only).
  const CITY = [["Bengaluru", "Bengaluru Urban", "Karnataka", 34, [2.6, 2.9, 3.6, 3.2, 3.5, 3.1, 3.8, 3.9]], ["Mysuru", "Mysuru", "Karnataka", 11, [3.6, 3.7, 3.9, 4.3, 3.9, 3.2, 3.6, 3.8]],
    ["Mumbai", "Mumbai City", "Maharashtra", 29, [2.5, 3.2, 4.1, 2.9, 3.6, 4.2, 3.5, 3.6]], ["Pune", "Pune", "Maharashtra", 18, [2.9, 3.3, 3.9, 3.3, 3.8, 3.0, 3.8, 4.1]],
    ["New Delhi", "New Delhi", "Delhi", 26, [3.4, 2.8, 3.8, 2.7, 2.9, 4.0, 3.6, 3.7]], ["Chennai", "Chennai", "Tamil Nadu", 21, [3.0, 2.6, 3.7, 3.1, 3.9, 3.6, 4.0, 4.0]],
    ["Hyderabad", "Hyderabad", "Telangana", 19, [3.3, 3.1, 3.8, 3.2, 3.8, 3.4, 3.7, 3.8]], ["Kolkata", "Kolkata", "West Bengal", 15, [2.8, 3.4, 3.6, 2.9, 3.6, 3.7, 3.4, 3.7]],
    ["Ahmedabad", "Ahmadabad", "Gujarat", 14, [3.5, 3.5, 4.1, 3.4, 4.0, 3.3, 3.6, 3.7]], ["Lucknow", "Lucknow", "Uttar Pradesh", 12, [2.7, 2.9, 3.2, 2.8, 3.1, 2.7, 3.2, 3.4]],
    ["Indore", "Indore", "Madhya Pradesh", 10, [3.8, 3.4, 3.7, 4.6, 3.8, 3.2, 3.5, 3.6]], ["Kochi", "Ernakulam", "Kerala", 9, [3.1, 3.6, 3.9, 3.7, 4.1, 3.4, 4.2, 4.3]],
    ["Patna", "Patna", "Bihar", 8, [2.2, 2.5, 2.8, 2.1, 2.6, 2.4, 2.6, 2.9]], ["Jaipur", "Jaipur", "Rajasthan", 7, [3.2, 2.7, 3.6, 3.3, 3.7, 3.0, 3.4, 3.6]],
    ["Guwahati", "Kamrup Metropolitan", "Assam", 2, [3, 3, 3, 3, 3, 3, 3, 3]]];
  const keys = ["roads", "water", "power", "cleanliness", "safety", "transport", "health", "education"];
  let rnd = 7; const r = () => { rnd = (rnd * 9301 + 49297) % 233280; return rnd / 233280; };
  CITY.forEach(([city, district, state, n, means], ci) => { for (let i = 0; i < n; i++) {
    const scores = {}; keys.forEach((k, j) => { if (i % 7 === 3 && j > 5) return; scores[k] = Math.max(1, Math.min(5, Math.round(means[j] + (r() - 0.5) * 2.2))); });
    db.city_survey.push({ id: uuid(), user_id: `sim-${ci}-${i}`, state, district, city, city_key: `${state.toLowerCase()}|${city.toLowerCase()}`, scores, created_at: daysAgo(70), updated_at: daysAgo(Math.floor(Math.pow(r(), 1.6) * 75)) });
  } });
  // Feedback Progress stages (migration 007)
  const SM = { Open: "Submitted", Acknowledged: "Under review", "In progress": "Action in progress", Resolved: "Outcome provided", Rejected: "Closed" };
  db.posts.forEach((p) => Object.assign(p, { status: SM[p.status] || p.status, sector: "government", organization_id: null, suggestion: null, service_location: null, experience_date: null, further_reviews: 0, status_changed_at: p.updated_at || p.created_at }));
  db.post_events.forEach((e) => { if (e.kind === "status" || e.kind === "created") { e.from_value = SM[e.from_value] || e.from_value; e.to_value = SM[e.to_value] || e.to_value; } });
  db.notifications.forEach((n) => { n.title = n.title.replace(/status is now (.+)$/, (m, x) => `progress is now ${SM[x] || x}`); });
  // Directory: the real official government list, plus one clearly labelled sample company for the preview.
  officialOrgRows().forEach((r) => db.organizations.push({ id: uuid(), name: r.name, sector: r.sector, category: r.category || null, subcategory: null, state: r.state || null, district: null, city: null, website: r.website, source_label: r.source_label, source_url: r.source_url, verified: r.verified, last_verified_at: r.verified ? "2026-10-13T00:00:00Z" : null, status: "published", created_by: S, created_at: daysAgo(20), updated_at: daysAgo(20) }));
  const fibre = { id: uuid(), name: "Example Fibre Co (sample)", sector: "private", category: "telecom", subcategory: "Broadband provider", state: "Karnataka", district: null, city: "Bengaluru", website: "https://www.example.com", source_label: "Sample record for the demo preview", source_url: "https://www.example.com", verified: true, last_verified_at: daysAgo(10), status: "published", created_by: S, created_at: daysAgo(30), updated_at: daysAgo(10) };
  db.organizations.push(fibre, { id: uuid(), name: "Corner Cafe Koramangala", sector: "private", category: "food", subcategory: "Cafe", state: "Karnataka", district: null, city: "Bengaluru", website: null, source_label: null, source_url: null, verified: false, last_verified_at: null, status: "pending", created_by: A, created_at: daysAgo(2), updated_at: daysAgo(2) });
  db.org_reps.push({ user_id: PERSONAS[4].id, organization_id: fibre.id, granted_by: S, created_at: daysAgo(9) });
  const priv = (author, title, body, rating, d, status, pub, suggestion) => {
    const id = uuid(), created = daysAgo(d);
    const p = { id, author_id: author, type: "review", cat: "telecom", sub: "Broadband provider", entity: fibre.name, city: "Bengaluru", tehsil: null, district: "Bengaluru Urban", state: "Karnataka", rating, severity: null, title, body, anon: false, visibility: "public", status, hidden: false, response: null, response_at: null, sample: false, created_at: created, updated_at: created, ref_no: `OYOI-${new Date().getFullYear()}-${String(db.seq++).padStart(6, "0")}`, publication: pub, assigned_to: null, withdrawn: false, evidence: [], lang: null, sector: "private", organization_id: fibre.id, suggestion, service_location: "HSR Layout", experience_date: daysAgo(d + 1).slice(0, 10), further_reviews: 0, status_changed_at: created };
    db.posts.push(p); db.post_events.push({ id: db.ev++, post_id: id, actor: author, kind: "created", from_value: null, to_value: "Submitted", reason: null, created_at: created });
    return p;
  };
  const f1 = priv(A, "Broadband down for six days", "My fibre connection was down for six days. Support raised three tickets but nobody visited until I escalated by email.", 2, 6, "Response awaited", "approved", "Share a ticket number and a visit time window for every outage.");
  priv(OTHERS[0][0], "Quick installation, friendly technician", "Installation was completed the next day and the technician explained the router settings clearly.", 5, 12, "Closed", "approved", null);
  db.org_responses.push({ id: uuid(), post_id: f1.id, organization_id: fibre.id, author_id: PERSONAS[4].id, body: "We are sorry for the delay. A fibre cut affected your area; we have added SMS visit slots so this does not repeat. Please DM your ticket number on our support page.", created_at: daysAgo(4) });
  db.post_events.push({ id: db.ev++, post_id: f1.id, actor: PERSONAS[4].id, kind: "org_response", from_value: null, to_value: "We are sorry for the delay.", reason: null, created_at: daysAgo(4) });
  db.notifications.push({ id: db.ev++, user_id: A, post_id: f1.id, title: `${f1.ref_no}: ${fibre.name} responded`, body: "We are sorry for the delay.", read: false, created_at: daysAgo(4) });
  db.rti_requests.push({ id: uuid(), user_id: PERSONAS[0].id, title: "Work order for MG Road resurfacing", authority: "Bruhat Bengaluru Mahanagara Palike", level: "state", state: "Karnataka", reg_no: null, filed_on: daysAgo(36).slice(0, 10), via_apio: false, life_liberty: false, third_party: false, reply_on: null, fa_filed_on: null, fa_order_on: null, sa_filed_on: null, status: "open", draft: null, notes: null, created_at: daysAgo(36), updated_at: daysAgo(36) });
  return db;
}
let DB;
const load = () => { try { DB = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { DB = seed(); } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch { /* ignore */ } };
export const resetDemo = () => { DB = seed(); save(); };

/* ---------- session and permissions ---------- */
const meId = () => { try { return JSON.parse(localStorage.getItem("sb-demo-auth-token") || "null")?.user?.id || null; } catch { return null; } };
const prof = (id) => DB.profiles.find((p) => p.id === id);
const role = () => { const p = prof(meId()); return p && p.active !== false ? p.role : "citizen"; };
const isMod = () => ["moderator", "admin", "super_admin", "state_admin", "district_admin"].includes(role());
const isAdmin = () => ["admin", "super_admin"].includes(role());
const canContent = () => ["content_manager", "admin", "super_admin"].includes(role());
const inScope = (p) => { const r = role(), me = prof(meId()); if (["super_admin", "admin", "moderator"].includes(r)) return true; if (r === "state_admin") return me?.scope_state?.toLowerCase() === p.state?.toLowerCase(); if (r === "district_admin") return me?.scope_state?.toLowerCase() === p.state?.toLowerCase() && me?.scope_district?.toLowerCase() === (p.district || "").toLowerCase(); return false; };
const canSeePost = (p) => (p.visibility === "public" && !p.hidden && p.publication === "approved" && !p.withdrawn) || p.author_id === meId() || (isMod() && inScope(p)) || role() === "analyst";
const canSeeEvent = (e) => { const p = DB.posts.find((x) => x.id === e.post_id); if (!p) return false; return (e.kind !== "note" && p.author_id === meId()) || (isMod() && inScope(p)) || (role() === "analyst" && e.kind !== "note"); };
const visible = {
  posts: () => DB.posts.filter(canSeePost),
  post_events: () => DB.post_events.filter(canSeeEvent),
  notifications: () => DB.notifications.filter((n) => n.user_id === meId()),
  profiles: () => DB.profiles,
  profile_details: () => DB.profile_details.filter((d) => d.id === meId()),
  votes: () => DB.votes.filter((v) => v.user_id === meId()),
  vote_counts: () => Object.values(DB.votes.reduce((m, v) => { const k = v.post_id + v.kind; m[k] = m[k] || { post_id: v.post_id, kind: v.kind, n: 0 }; m[k].n++; return m; }, {})),
  cms_items: () => DB.cms_items.filter((i) => (i.status === "published" && (!i.publish_at || new Date(i.publish_at) <= new Date())) || canContent()),
  cms_revisions: () => (canContent() ? DB.cms_revisions : []),
  sync_runs: () => (canContent() ? DB.sync_runs : []),
  audit_log: () => (isAdmin() ? DB.audit_log : []),
  city_survey: () => DB.city_survey.filter((x) => x.user_id === meId()),
  rti_requests: () => DB.rti_requests.filter((x) => x.user_id === meId()),
  organizations: () => DB.organizations.filter((o) => o.status === "published" || o.created_by === meId() || canContent() || isMod()),
  org_reps: () => DB.org_reps.filter((r) => r.user_id === meId() || isAdmin()).map((r) => ({ ...r, organizations: DB.organizations.find((o) => o.id === r.organization_id) || null })),
  org_responses: () => DB.org_responses.filter((r) => { const p = DB.posts.find((x) => x.id === r.post_id); return p && canSeePost(p); }),
};
const isOrgRep = (orgId) => role() === "org_rep" && DB.org_reps.some((r) => r.user_id === meId() && r.organization_id === orgId);
const nameKey = (n) => String(n).trim().replace(/\s+/g, " ").toLowerCase();
const orgDup = (r) => DB.organizations.some((o) => o.id !== r.id && nameKey(o.name) === nameKey(r.name) && o.sector === r.sector && (o.state || "").toLowerCase() === (r.state || "").toLowerCase() && (o.city || "").toLowerCase() === (r.city || "").toLowerCase());

/* ---------- triggers ---------- */
function event(post, kind, from, to, reason) {
  const e = { id: DB.ev++, post_id: post.id, actor: meId(), kind, from_value: from, to_value: to, reason: reason || null, created_at: now() };
  DB.post_events.push(e);
  if (post.author_id !== meId() && ["status", "publication", "response", "org_response"].includes(kind) && (kind !== "publication" || to !== "pending")) {
    const t = kind === "org_response" ? `${post.ref_no}: ${(DB.organizations.find((o) => o.id === post.organization_id) || {}).name || "the organisation"} responded` : kind === "status" ? `${post.ref_no}: progress is now ${to}` : kind === "publication" ? `${post.ref_no}: ${to === "approved" ? "published on the site" : "not published"}` : `${post.ref_no}: official response added`;
    DB.notifications.push({ id: DB.ev++, user_id: post.author_id, post_id: post.id, title: t, body: kind === "response" || kind === "org_response" ? to : reason || post.title, read: false, created_at: now() });
  }
}
function updatePost(p, patch, reason) {
  const old = { ...p }; Object.assign(p, patch, { updated_at: now() });
  if (p.status !== old.status) p.status_changed_at = now();
  if (p.status !== old.status) event(p, "status", old.status, p.status, reason);
  if (p.publication !== old.publication) event(p, "publication", old.publication, p.publication, reason);
  if (p.assigned_to !== old.assigned_to) event(p, "assignment", old.assigned_to, p.assigned_to, reason);
  if (p.response !== old.response) event(p, "response", null, p.response, null);
  if (p.hidden !== old.hidden) event(p, "hidden", String(old.hidden), String(p.hidden), reason);
  if (p.withdrawn && !old.withdrawn) event(p, "withdrawn", null, null, reason);
}
const hash = (o) => { const s = JSON.stringify(o); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); };
function cmsRev(it, note) { DB.cms_revisions.push({ id: DB.ev++, item_id: it.id, version: it.version, data: JSON.parse(JSON.stringify(it.data)), status: it.status, publish_at: it.publish_at, actor: meId(), note: note || null, created_at: now() }); }
function cmsUpdate(it, patch, note) {
  const changed = ["data", "status", "publish_at"].some((k) => k in patch && JSON.stringify(patch[k]) !== JSON.stringify(it[k]));
  Object.assign(it, patch, { updated_at: now() });
  if (changed) { it.version++; it.updated_by = meId(); cmsRev(it, note); }
}

/* ---------- RPC ---------- */
const deny = () => { throw Object.assign(new Error("not authorised"), { status: 403 }); };
const meter = (rows) => { const sum = {}, cnt = {}; rows.forEach((x) => Object.entries(x.scores).forEach(([k, v]) => { sum[k] = (sum[k] || 0) + v; cnt[k] = (cnt[k] || 0) + 1; }));
  const dims = Object.fromEntries(Object.keys(sum).map((k) => [k, Math.round(((sum[k] / cnt[k] - 1) / 4) * 1000) / 10])); const vals = Object.keys(sum).map((k) => sum[k] / cnt[k]);
  return { dims, score: vals.length ? Math.round(((vals.reduce((a, b) => a + b, 0) / vals.length - 1) / 4) * 1000) / 10 : null }; };
const RPC = {
  city_meter(a) {
    const g = {}; DB.city_survey.forEach((x) => (g[x.city_key] = g[x.city_key] || []).push(x));
    return Object.values(g).filter((rows) => rows.length >= Math.max(a.p_min || 3, 3)).map((rows) => ({ state: rows[0].state, city: rows[0].city, district: rows[0].district, responses: rows.length, updated_at: rows[0].updated_at, ...meter(rows) })).sort((x, y) => y.score - x.score);
  },
  state_meter(a) {
    const g = {}; DB.city_survey.forEach((x) => (g[x.state.toLowerCase()] = g[x.state.toLowerCase()] || []).push(x));
    return Object.values(g).filter((rows) => rows.length >= Math.max(a.p_min || 3, 3)).map((rows) => ({ state: rows[0].state, responses: rows.length, cities: new Set(rows.map((x) => x.city_key)).size, ...meter(rows) })).sort((x, y) => y.score - x.score);
  },
  survey_trend(a) {
    const wk = (iso) => { const d = new Date(iso); const day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); return d.toISOString().slice(0, 10); };
    const start = new Date(); start.setDate(start.getDate() - 7 * ((a.p_weeks || 12) - 1)); const from = wk(start.toISOString());
    const g = {}; DB.city_survey.forEach((x) => { const w = wk(x.updated_at); if (w >= from) (g[w] = g[w] || []).push(x); });
    return Object.keys(g).sort().map((w) => ({ week: w, responses: g[w].length, score: meter(g[w]).score }));
  },
  india_meter() { const m = meter(DB.city_survey); return [{ responses: DB.city_survey.length, cities: new Set(DB.city_survey.map((x) => x.city_key)).size, states: new Set(DB.city_survey.map((x) => x.state.toLowerCase())).size, ...m }]; },
  staff_update(a) {
    if (!isMod()) deny(); const p = DB.posts.find((x) => x.id === a.p_id && inScope(x)); if (!p) throw new Error("not found or outside your scope");
    const patch = {};
    if (a.p_status) patch.status = a.p_status; if (a.p_publication) patch.publication = a.p_publication;
    if (a.p_unassign) patch.assigned_to = null; else if (a.p_assigned) patch.assigned_to = a.p_assigned;
    if (a.p_response != null) { patch.response = a.p_response; patch.response_at = now(); } if (a.p_hidden != null) patch.hidden = a.p_hidden;
    updatePost(p, patch, a.p_reason); return null;
  },
  withdraw_feedback(a) { const p = DB.posts.find((x) => x.id === a.p_id && x.author_id === meId() && !["Outcome provided", "Closed"].includes(x.status)); if (!p) throw new Error("cannot withdraw this feedback"); updatePost(p, { withdrawn: true }, a.p_reason); return null; },
  org_import(a) {
    if (!canContent()) deny(); let n = 0;
    for (const r of a.p_rows) {
      const ex = DB.organizations.find((o) => nameKey(o.name) === nameKey(r.name) && o.sector === (r.sector || "government") && (o.state || "") === (r.state || "") && !o.city);
      const rec = { website: r.website, source_label: r.source_label, source_url: r.source_url, category: r.category || null };
      if (ex) Object.assign(ex, rec, { verified: ex.verified || !!r.verified, last_verified_at: r.verified_at || ex.last_verified_at, updated_at: now() });
      else DB.organizations.push({ id: uuid(), name: r.name, sector: r.sector || "government", subcategory: null, state: r.state || null, district: null, city: null, ...rec, verified: !!r.verified, last_verified_at: r.verified_at || null, status: "published", created_by: meId(), created_at: now(), updated_at: now() });
      n++;
    }
    DB.audit_log.push({ id: DB.ev++, actor: meId(), action: "org_import", target: "organizations", detail: { rows: n }, created_at: now() }); return n;
  },
  admin_set_org_rep(a) {
    if (!isAdmin()) deny();
    if (a.p_grant !== false) {
      const o = DB.organizations.find((x) => x.id === a.p_org); if (!o || !o.verified || o.status !== "published") throw new Error("organisation must be verified and published first");
      if (!DB.org_reps.some((r) => r.user_id === a.p_user && r.organization_id === a.p_org)) DB.org_reps.push({ user_id: a.p_user, organization_id: a.p_org, granted_by: meId(), created_at: now() });
      const p = prof(a.p_user); if (p && p.role === "citizen") p.role = "org_rep";
    } else {
      DB.org_reps = DB.org_reps.filter((r) => !(r.user_id === a.p_user && r.organization_id === a.p_org));
      const p = prof(a.p_user); if (p && p.role === "org_rep" && !DB.org_reps.some((r) => r.user_id === a.p_user)) p.role = "citizen";
    }
    DB.audit_log.push({ id: DB.ev++, actor: meId(), action: a.p_grant !== false ? "org_rep_grant" : "org_rep_revoke", target: a.p_user, detail: { organization: a.p_org }, created_at: now() }); return null;
  },
  org_respond(a) {
    const p = DB.posts.find((x) => x.id === a.p_post);
    if (!p || !p.organization_id || !isOrgRep(p.organization_id)) deny();
    if (p.visibility !== "public" || p.publication !== "approved" || p.hidden || p.withdrawn) throw new Error("feedback is not published");
    if (!a.p_body || a.p_body.length < 10) throw new Error("response is too short");
    const r = { id: uuid(), post_id: p.id, organization_id: p.organization_id, author_id: meId(), body: a.p_body, created_at: now() };
    DB.org_responses.push(r); event(p, "org_response", null, a.p_body.slice(0, 300), null); return r.id;
  },
  request_further_review(a) {
    if ((a.p_reason || "").length < 10) throw new Error("please explain why (at least 10 characters)");
    const p = DB.posts.find((x) => x.id === a.p_id && x.author_id === meId()); if (!p) throw new Error("not found");
    if (!["Outcome provided", "Closed"].includes(p.status)) throw new Error("further review is available after an outcome is provided");
    if (Date.now() - new Date(p.status_changed_at) > 30 * 864e5) throw new Error("the 30 day window for further review has passed");
    if ((p.further_reviews || 0) >= 2) throw new Error("further review has already been requested twice");
    const from = p.status; updatePost(p, { status: "Under review", further_reviews: (p.further_reviews || 0) + 1 }, `Further review requested: ${a.p_reason}`);
    DB.post_events.push({ id: DB.ev++, post_id: p.id, actor: meId(), kind: "further_review", from_value: from, to_value: "Under review", reason: a.p_reason, created_at: now() }); return null;
  },
  org_stats(a) {
    const ps = DB.posts.filter((p) => p.organization_id === a.p_org && p.visibility === "public" && p.publication === "approved" && !p.hidden && !p.withdrawn);
    const rated = ps.filter((p) => p.rating);
    return [{ reviews: rated.length, avg_rating: rated.length ? Math.round((rated.reduce((x, p) => x + p.rating, 0) / rated.length) * 10) / 10 : null, responses: DB.org_responses.filter((r) => r.organization_id === a.p_org).length, outcomes: ps.filter((p) => ["Outcome provided", "Closed"].includes(p.status)).length }];
  },
  staff_directory() { return isMod() ? DB.profiles.filter((p) => p.active && ["moderator", "admin", "super_admin", "state_admin", "district_admin"].includes(p.role)).map(({ id, display_name, role: r, scope_state, scope_district }) => ({ id, display_name, role: r, scope_state, scope_district })) : []; },
  admin_list_users() { if (!isAdmin()) deny(); return DB.users.map((u) => { const p = prof(u.id) || {}; return { ...u, phone: null, display_name: p.display_name, role: p.role, scope_state: p.scope_state, scope_district: p.scope_district, active: p.active }; }); },
  admin_set_role(a) {
    if (!isAdmin()) deny(); if (a.p_role === "super_admin" && role() !== "super_admin") throw new Error("only a super admin can grant super admin");
    if (a.p_user === meId() && !["admin", "super_admin"].includes(a.p_role)) throw new Error("you cannot remove your own admin role");
    const p = prof(a.p_user); const from = p?.role; Object.assign(p, { role: a.p_role, scope_state: a.p_state, scope_district: a.p_district, active: a.p_active });
    DB.audit_log.push({ id: DB.ev++, actor: meId(), action: "role_change", target: a.p_user, detail: { from, to: a.p_role, state: a.p_state, district: a.p_district, active: a.p_active }, created_at: now() }); return null;
  },
  cms_import(a) {
    if (!canContent()) deny();
    const run = { id: DB.ev++, source: a.p_source, mode: a.p_mode || "manual", status: "success", total: a.p_rows.length, imported: 0, changed: 0, unchanged: 0, failed: 0, errors: [], build: a.p_build, actor: meId(), started_at: now(), finished_at: now() };
    a.p_rows.forEach((r) => {
      try {
        if (!r.collection || !r.key || typeof r.data !== "object") throw new Error("collection, key and data object are required");
        const h = hash(r.data); const cur = DB.cms_items.find((i) => i.collection === r.collection && i.key === r.key);
        if (!cur) { const it = { id: uuid(), collection: r.collection, key: r.key, data: r.data, status: "draft", publish_at: null, version: 1, source: a.p_source, source_hash: h, staged_data: null, staged_hash: null, staged_at: null, updated_by: meId(), created_at: now(), updated_at: now() }; DB.cms_items.push(it); cmsRev(it, `Imported from ${a.p_source}`); run.imported++; }
        else if (cur.source_hash === h || cur.staged_hash === h) run.unchanged++;
        else { Object.assign(cur, { staged_data: r.data, staged_hash: h, staged_at: now() }); run.changed++; }
      } catch (e) { run.failed++; run.errors.push({ key: `${r.collection}/${r.key}`, error: e.message }); }
    });
    run.status = run.failed === 0 ? "success" : run.failed < run.total ? "partial" : "failed"; DB.sync_runs.unshift(run); return run;
  },
  cms_save(a) {
    if (!canContent()) deny(); const it = DB.cms_items.find((i) => i.id === a.p_id); if (!it) throw new Error("item not found");
    const patch = {}; if (a.p_data) patch.data = a.p_data; if (a.p_status) patch.status = a.p_status;
    if (a.p_clear_schedule) patch.publish_at = null; else if (a.p_publish_at) patch.publish_at = a.p_publish_at;
    cmsUpdate(it, patch, a.p_note); return null;
  },
  cms_accept_staged(a) {
    if (!canContent()) deny(); const it = DB.cms_items.find((i) => i.id === a.p_id);
    if (a.p_accept) cmsUpdate(it, { data: it.staged_data, source_hash: it.staged_hash, staged_data: null, staged_hash: null, staged_at: null }, "Accepted source update");
    else Object.assign(it, { source_hash: it.staged_hash, staged_data: null, staged_hash: null, staged_at: null }); return null;
  },
  cms_rollback(a) { if (!canContent()) deny(); const it = DB.cms_items.find((i) => i.id === a.p_id); const r = DB.cms_revisions.find((x) => x.item_id === a.p_id && x.version === a.p_version); if (!r) throw new Error("version not found"); cmsUpdate(it, { data: r.data }, `Rolled back to version ${a.p_version}`); return null; },
};

/* ---------- PostgREST subset ---------- */
function filters(params) {
  const fs = [];
  for (const [k, v] of params) {
    if (["select", "order", "limit", "offset", "on_conflict", "columns"].includes(k)) continue;
    const m = v.match(/^(eq|neq|gte|lte|gt|lt|in|is|ilike)\.(.*)$/s); if (!m) continue;
    const [, op, raw] = m;
    fs.push((row) => {
      const x = row[k];
      if (op === "eq") return String(x) === raw; if (op === "neq") return String(x) !== raw;
      if (op === "gte") return x >= raw; if (op === "lte") return x <= raw; if (op === "gt") return x > raw; if (op === "lt") return x < raw;
      if (op === "in") return raw.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, "")).includes(String(x));
      if (op === "ilike") { const re = new RegExp("^" + decodeURIComponent(raw).replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/\*/g, ".*") + "$", "i"); return re.test(String(x ?? "")); }
      if (op === "is") return raw === "null" ? x == null : String(x) === raw; return true;
    });
  }
  return (row) => fs.every((f) => f(row));
}
function order(rows, spec) {
  if (!spec) return rows;
  const keys = spec.split(",").map((s) => { const [c, dir] = s.split("."); return [c, dir === "desc" ? -1 : 1]; });
  return [...rows].sort((a, b) => { for (const [c, d] of keys) { if (a[c] < b[c]) return -d; if (a[c] > b[c]) return d; } return 0; });
}
const json = (body, status = 200) => new Response(body === undefined ? "" : JSON.stringify(body), { status, headers: { "content-type": "application/json", "content-range": "*/*" } });
const TABLE_WRITE = {
  posts: { insert: (r) => !!meId() && r.author_id === meId(), update: (r) => isMod() && inScope(r) },
  profiles: { insert: (r) => r.id === meId(), update: (r) => r.id === meId() },
  profile_details: { insert: (r) => r.id === meId(), update: (r) => r.id === meId() },
  votes: { insert: (r) => r.user_id === meId(), delete: (r) => r.user_id === meId() },
  notifications: { update: (r) => r.user_id === meId() },
  post_events: { insert: (r) => r.kind === "note" && isMod() && inScope(DB.posts.find((p) => p.id === r.post_id) || {}) },
  cms_items: { insert: () => canContent(), update: () => canContent() },
  organizations: { insert: (r) => !!meId() && (canContent() || (r.created_by === meId() && r.status === "pending" && !r.verified && !r.source_url)), update: () => canContent(), delete: () => isAdmin() },
  rti_requests: { insert: (r) => !!meId() && r.user_id === meId(), update: (r) => r.user_id === meId(), delete: (r) => r.user_id === meId() },
  city_survey: { insert: (r) => !!meId() && r.user_id === meId() && !DB.city_survey.some((x) => x.user_id === meId() && x.city_key === r.city_key) && Object.values(r.scores || {}).every((v) => [1, 2, 3, 4, 5].includes(v)), update: (r) => r.user_id === meId() },
};
async function handle(url, init) {
  const u = new URL(url); const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || {}); const single = (headers.get("accept") || "").includes("vnd.pgrst.object");
  const body = init.body ? JSON.parse(init.body) : null;
  if (u.pathname.startsWith("/auth/v1/")) {
    if (u.pathname.endsWith("/verify")) return json({ error: "demo", error_description: "This is a demo. Use the 'Viewing as' switcher at the bottom of the page.", msg: "This is a demo. Use the 'Viewing as' switcher at the bottom of the page." }, 400);
    return json({});
  }
  if (u.pathname.startsWith("/storage/v1/")) return json({ signedURL: "", signedUrl: "" });
  if (u.pathname.startsWith("/rest/v1/rpc/")) {
    const fn = u.pathname.split("/rpc/")[1];
    try { const r = RPC[fn] ? RPC[fn](body || {}) : null; save(); return json(r); } catch (e) { return json({ message: e.message, code: "P0001" }, e.status || 400); }
  }
  const table = u.pathname.split("/rest/v1/")[1];
  const match = filters(u.searchParams);
  if (method === "GET" || method === "HEAD") {
    let rows = (visible[table] ? visible[table]() : []).filter(match);
    rows = order(rows, u.searchParams.get("order")); const lim = Number(u.searchParams.get("limit")); if (lim) rows = rows.slice(0, lim);
    if (single) return rows.length ? json(rows[0]) : json({ code: "PGRST116", message: "no rows" }, 406);
    return json(rows);
  }
  const rule = TABLE_WRITE[table] || {};
  if (method === "POST") {
    const upsert = (headers.get("prefer") || "").includes("merge-duplicates");
    const list = (Array.isArray(body) ? body : [body]).map((r) => ({ ...r }));
    const out = [];
    for (const r of list) {
      if (table === "posts") { r.author_id = r.author_id || meId(); Object.assign(r, { id: uuid(), ref_no: `OYOI-${new Date().getFullYear()}-${String(DB.seq++).padStart(6, "0")}`, publication: "pending", status: "Submitted", further_reviews: 0, status_changed_at: now(), sector: r.sector || "government", assigned_to: null, withdrawn: false, hidden: false, response: null, response_at: null, sample: false, created_at: now(), updated_at: now(), evidence: r.evidence || [] }); }
      if (table === "votes") r.user_id = r.user_id || meId();
      if (table === "post_events") Object.assign(r, { id: DB.ev++, actor: meId(), created_at: now() });
      if (table === "organizations") { Object.assign(r, { id: uuid(), status: r.status || "pending", verified: !!r.verified, created_by: r.created_by || meId(), created_at: now(), updated_at: now() }); if (r.verified && !r.last_verified_at) r.last_verified_at = null; if (r.verified && (!r.source_url || !r.last_verified_at)) return json({ message: 'new row violates check constraint "organizations_verified_source"' }, 400); if (orgDup(r)) return json({ message: 'duplicate key value violates unique constraint "organizations_unique"' }, 409); }
      if (table === "cms_items") Object.assign(r, { id: uuid(), status: "draft", version: 1, publish_at: null, created_at: now(), updated_at: now() });
      if (table === "rti_requests") Object.assign(r, { id: uuid(), status: r.status || "open", created_at: now(), updated_at: now() });
      if (table === "city_survey") Object.assign(r, { id: uuid(), city_key: `${r.state.trim().toLowerCase()}|${r.city.trim().toLowerCase()}`, created_at: now(), updated_at: now() });
      const existing = upsert && DB[table].find((x) => x.id === r.id);
      if (existing) { if (!rule.update?.(existing)) return json({ message: "permission denied" }, 403); Object.assign(existing, r); out.push(existing); continue; }
      if (!rule.insert?.(r)) return json({ message: "new row violates row level security" }, 403);
      DB[table].push(r); out.push(r);
      if (table === "posts") { if (r.organization_id && !DB.organizations.some((o) => o.id === r.organization_id)) r.organization_id = null; event(r, "created", null, "Submitted", null); }
      if (table === "cms_items") cmsRev(r, "Created");
    }
    save(); return single ? json(out[0], 201) : json(out, 201);
  }
  if (method === "PATCH") {
    const rows = DB[table].filter(match).filter((r) => rule.update?.(r));
    if (table === "organizations") for (const r of rows) { const nx = { ...r, ...body }; if (nx.verified && (!nx.source_url || !nx.last_verified_at)) return json({ message: 'new row violates check constraint "organizations_verified_source"' }, 400); if (orgDup(nx)) return json({ message: "duplicate key value" }, 409); }
    rows.forEach((r) => (table === "posts" ? updatePost(r, body, null) : Object.assign(r, body, table === "organizations" ? { updated_at: now() } : {}, table === "city_survey" ? { city_key: `${(body.state || r.state).trim().toLowerCase()}|${(body.city || r.city).trim().toLowerCase()}`, updated_at: now() } : {})));
    save(); return single ? json(rows[0]) : json(rows);
  }
  if (method === "DELETE") { const keep = DB[table].filter((r) => !(match(r) && rule.delete?.(r))); DB[table] = keep; save(); return json([]); }
  return json({ message: "unsupported" }, 400);
}

export function installMock() {
  load(); save();
  const real = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input.url;
    if (url.startsWith(URL_BASE)) { await new Promise((r) => setTimeout(r, 60)); return handle(url, { ...init, method: init.method || input.method }); }
    return real(input, init);
  };
  // No realtime socket in the demo; the portals refresh after each action and poll every 30 s.
  const RealWS = window.WebSocket;
  window.WebSocket = function (url, p) { if (String(url).includes("demo.supabase.co")) return { send() {}, close() {}, addEventListener() {}, removeEventListener() {}, readyState: 3 }; return new RealWS(url, p); };
}
export function signInAs(id) {
  try {
    if (!id) localStorage.removeItem("sb-demo-auth-token");
    else localStorage.setItem("sb-demo-auth-token", JSON.stringify({ access_token: "demo", refresh_token: "demo", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 36000, user: { id, email: PERSONAS.find((p) => p.id === id)?.email, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" } } }));
  } catch { /* ignore */ }
}
