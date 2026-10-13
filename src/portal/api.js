/* Data access for the user dashboard and admin portal.
 * Every call goes through Supabase with the signed in user's token, so the
 * database's row level security decides what each person can see or change. */
import { sb } from "../sb.js";

import { STATUSES, STATUS_TONE, DONE_STATUSES } from "../data.js";
export const WORKFLOW = STATUSES;
export { DONE_STATUSES };
export const STATUS_LABEL = Object.fromEntries(STATUSES.map((x) => [x, x]));
export const STATUS_COLOR = STATUS_TONE;
export const PUB_LABEL = { pending: "Awaiting moderation", approved: "Public", rejected: "Not published", private: "Private" };
export const ROLES = [
  ["super_admin", "Super Administrator"], ["admin", "Platform Administrator"], ["content_manager", "Content Manager"],
  ["state_admin", "State Administrator"], ["district_admin", "District Administrator"], ["moderator", "Feedback Moderator"],
  ["analyst", "Analytics Viewer"], ["org_rep", "Organisation Representative"], ["citizen", "Registered Public User"],
];
export const roleName = (r) => (ROLES.find((x) => x[0] === r) || [r, r])[1];
export const STAFF = ["super_admin", "admin", "moderator", "state_admin", "district_admin"];
export const ADMIN = ["super_admin", "admin"];

const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

export async function session() {
  const c = sb(); if (!c) return { user: null, role: "citizen", profile: null };
  const { data: { session: s } } = await c.auth.getSession();
  if (!s?.user) return { user: null, role: "citizen", profile: null };
  const { data: profile } = await c.from("profiles").select("*").eq("id", s.user.id).maybeSingle();
  return { user: s.user, role: profile?.active === false ? "citizen" : profile?.role || "citizen", profile };
}

export const myFeedback = async (uid) => must(await sb().from("posts").select("*").eq("author_id", uid).order("created_at", { ascending: false }));
export const feedbackEvents = async (postId) => must(await sb().from("post_events").select("*").eq("post_id", postId).order("created_at"));
export const myNotifications = async (uid) => must(await sb().from("notifications").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(50));
export const markAllRead = async (uid) => must(await sb().from("notifications").update({ read: true }).eq("user_id", uid).eq("read", false));
export const withdraw = async (id, reason) => must(await sb().rpc("withdraw_feedback", { p_id: id, p_reason: reason || null }));

// Admin queue: row level security already limits rows to the staff member's jurisdiction.
export async function queue({ from, to } = {}) {
  let q = sb().from("posts").select("*").order("created_at", { ascending: false }).limit(2000);
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);
  return must(await q);
}
export const staffUpdate = async (id, patch) => must(await sb().rpc("staff_update", {
  p_id: id, p_status: patch.status ?? null, p_publication: patch.publication ?? null, p_assigned: patch.assigned ?? null,
  p_unassign: !!patch.unassign, p_response: patch.response ?? null, p_hidden: patch.hidden ?? null, p_reason: patch.reason || null,
}));
export const addNote = async (postId, uid, text) => must(await sb().from("post_events").insert({ post_id: postId, actor: uid, kind: "note", reason: text }));
export const staffDirectory = async () => must(await sb().rpc("staff_directory"));
export const listUsers = async () => must(await sb().rpc("admin_list_users"));
export const setRole = async (u, role, st, di, active = true) => must(await sb().rpc("admin_set_role", { p_user: u, p_role: role, p_state: st || null, p_district: di || null, p_active: active }));
export const auditLog = async () => must(await sb().from("audit_log").select("*").order("created_at", { ascending: false }).limit(200));
export const recentEvents = async () => must(await sb().from("post_events").select("*").order("created_at", { ascending: false }).limit(200));
export async function names(ids) {
  const u = [...new Set(ids.filter(Boolean))]; if (!u.length) return {};
  const { data } = await sb().from("profiles").select("id, display_name").in("id", u);
  return Object.fromEntries((data || []).map((r) => [r.id, r.display_name || "Unnamed"]));
}

// Realtime: refresh when posts, history or notifications change; 30 second polling as fallback.
export function live(onChange) {
  const c = sb(); let t; const kick = () => { clearTimeout(t); t = setTimeout(onChange, 300); };
  const ch = c.channel("portal-" + Math.random().toString(36).slice(2))
    .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, kick)
    .on("postgres_changes", { event: "*", schema: "public", table: "post_events" }, kick)
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, kick).subscribe();
  const poll = setInterval(onChange, 30000);
  return () => { clearInterval(poll); clearTimeout(t); c.removeChannel(ch); };
}

export function toCsv(rows, cols) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const body = [cols.map((c) => esc(c[0])).join(","), ...rows.map((r) => cols.map((c) => esc(c[1](r))).join(","))].join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["\ufeff" + body], { type: "text/csv;charset=utf-8" }));
  a.download = `oyoi-feedback-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
}
export const fmt = (iso) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "");
export const place = (p) => [p.city, p.district, p.state].filter(Boolean).join(", ");

/* ---------- Website content (CMS) and Website Data Sync ---------- */
export const CONTENT = ["content_manager", "admin", "super_admin"];
export const cmsItems = async () => must(await sb().from("cms_items").select("*").order("collection").order("key"));
export const cmsRevisions = async (id) => must(await sb().from("cms_revisions").select("*").eq("item_id", id).order("version", { ascending: false }).limit(50));
export const cmsCreate = async (collection, key, data) => must(await sb().from("cms_items").insert({ collection, key, data }).select().single());
export const cmsSave = async (id, { data = null, status = null, publishAt = null, clearSchedule = false, note = null }) =>
  must(await sb().rpc("cms_save", { p_id: id, p_data: data, p_status: status, p_publish_at: publishAt, p_clear_schedule: clearSchedule, p_note: note }));
export const cmsAccept = async (id, accept) => must(await sb().rpc("cms_accept_staged", { p_id: id, p_accept: accept }));
export const cmsRollback = async (id, version) => must(await sb().rpc("cms_rollback", { p_id: id, p_version: version }));
export const cmsImport = async (source, rows, mode, build) => must(await sb().rpc("cms_import", { p_source: source, p_rows: rows, p_mode: mode, p_build: build }));
export const syncRuns = async () => must(await sb().from("sync_runs").select("*").order("started_at", { ascending: false }).limit(100));

// ---------- Voice for Change: organisations, responses, further review ----------
export const orgResponsesFor = async (postIds) => (postIds.length ? must(await sb().from("org_responses").select("*").in("post_id", postIds).order("created_at")) : []);
export const requestFurtherReview = async (id, reason) => must(await sb().rpc("request_further_review", { p_id: id, p_reason: reason }));
export const myOrgs = async (uid) => must(await sb().from("org_reps").select("organization_id, organizations(id, name, sector, verified, website)").eq("user_id", uid)).map((r) => r.organizations).filter(Boolean);
export const orgFeedback = async (orgIds) => (orgIds.length ? must(await sb().from("posts").select("*").in("organization_id", orgIds).eq("publication", "approved").eq("visibility", "public").eq("withdrawn", false).order("created_at", { ascending: false }).limit(500)) : []);
export const orgRespond = async (postId, body) => must(await sb().rpc("org_respond", { p_post: postId, p_body: body }));
export const orgsByIds = async (ids) => (ids.length ? must(await sb().from("organizations").select("id, name, verified, sector").in("id", ids)) : []);

// Admin: organisation directory
export async function listOrgs({ q = "", sector = "all", status = "all" } = {}) {
  let query = sb().from("organizations").select("*").order("status").order("name").limit(1000);
  if (sector !== "all") query = query.eq("sector", sector);
  if (status !== "all") query = query.eq("status", status);
  if (q.trim()) query = query.ilike("name", `%${q.trim().replace(/[%_]/g, "")}%`);
  return must(await query);
}
export const saveOrg = async (id, patch) => must(await sb().from("organizations").update(patch).eq("id", id).select().single());
export const createOrg = async (row) => must(await sb().from("organizations").insert(row).select().single());
export const importOrgs = async (rows) => must(await sb().rpc("org_import", { p_rows: rows }));
export const setOrgRep = async (userId, orgId, grant = true) => must(await sb().rpc("admin_set_org_rep", { p_user: userId, p_org: orgId, p_grant: grant }));
export const orgReps = async (orgId) => must(await sb().from("org_reps").select("user_id, created_at").eq("organization_id", orgId));
