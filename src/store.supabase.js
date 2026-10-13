/*
 * Production data layer on Supabase (Postgres + Realtime + Auth).
 * Activated when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build time.
 * Run supabase/schema.sql in your project first. Phone OTP needs an SMS provider
 * (for example MSG91 or Twilio) configured under Authentication > Providers > Phone.
 */
import { sb as getClient } from "./sb.js";

const toPost = (r) => ({
  id: r.id, type: r.type, cat: r.cat, sub: r.sub, entity: r.entity, city: r.city, tehsil: r.tehsil, district: r.district, state: r.state,
  rating: r.rating, severity: r.severity, title: r.title, body: r.body, anon: r.anon, visibility: r.visibility,
  createdAt: r.created_at, refNo: r.ref_no, publication: r.publication, withdrawn: r.withdrawn, authorId: r.anon ? null : r.author_id, ownerId: r.author_id, sample: r.sample, evidence: r.evidence || [], lang: r.lang,
  sector: r.sector || "government", organizationId: r.organization_id || null, suggestion: r.suggestion || "", serviceLocation: r.service_location || "", experienceDate: r.experience_date || null,
});

export async function connectSupabase() {
  const sb = getClient();
  const { data: { session } } = await sb.auth.getSession();
  const me = session?.user?.id || null;
  let isAdmin = false, role = "citizen";
  if (me) {
    const { data } = await sb.from("profiles").select("role").eq("id", me).maybeSingle();
    role = data?.role || "citizen";
    isAdmin = ["moderator", "admin", "super_admin", "state_admin", "district_admin"].includes(role);
  }
  let mineVotes = { metoo: [], flags: [], helpful: [] };
  let handlers = {};
  let timer = null;
  let postsById = {};

  async function loadPosts() {
    const { data, error } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) return handlers.onError?.(error);
    const rows = data || [];
    const status = {}, hidden = {}, responses = {}, evid = {};
    rows.forEach((r) => { (r.evidence || []).forEach((e) => { if (e.status && e.status !== "pending") evid[e.id] = e.status; }); status[r.id] = r.status; if (r.hidden) hidden[r.id] = true; if (r.response) responses[r.id] = { text: r.response, at: r.response_at }; });
    handlers.onPosts?.(rows.filter((r) => r.visibility === "public" && !r.withdrawn && (r.publication === "approved" || r.author_id === me || isAdmin)).map(toPost));
    handlers.onPrivate?.(rows.filter((r) => r.visibility === "private" && r.author_id === me).map(toPost));
    handlers.onStatus?.(status); handlers.onHidden?.(hidden); handlers.onResponses?.(responses); handlers.onEvidence?.(evid);
    postsById = Object.fromEntries(rows.map((r) => [r.id, r]));
    loadOrgs(rows);
  }
  async function loadOrgs(rows) {
    const orgIds = [...new Set(rows.map((r) => r.organization_id).filter(Boolean))];
    const ids = rows.map((r) => r.id);
    const [o, rs] = await Promise.all([
      orgIds.length ? sb.from("organizations").select("id, name, sector, verified, website, last_verified_at").in("id", orgIds) : { data: [] },
      ids.length ? sb.from("org_responses").select("id, post_id, organization_id, body, created_at").in("post_id", ids.slice(0, 300)).order("created_at") : { data: [] },
    ]);
    const orgs = Object.fromEntries((o.data || []).map((x) => [x.id, x]));
    const orgResponses = {};
    (rs.data || []).forEach((x) => (orgResponses[x.post_id] = orgResponses[x.post_id] || []).push(x));
    handlers.onOrgs?.({ orgs, orgResponses });
  }
  async function loadVotes() {
    const { data } = await sb.from("vote_counts").select("*");
    const metoo = {}, flags = {}, helpful = {};
    (data || []).forEach((r) => { if (r.kind === "metoo") metoo[r.post_id] = r.n; else if (r.kind === "helpful") helpful[r.post_id] = r.n; else flags[r.post_id] = r.n; });
    if (me) {
      const { data: mine } = await sb.from("votes").select("post_id, kind").eq("user_id", me);
      mineVotes = { metoo: (mine || []).filter((v) => v.kind === "metoo").map((v) => v.post_id), flags: (mine || []).filter((v) => v.kind === "flag").map((v) => v.post_id), helpful: (mine || []).filter((v) => v.kind === "helpful").map((v) => v.post_id) };
    }
    handlers.onVotes?.({ metoo, flags, helpful, mine: mineVotes });
  }
  const refresh = () => { clearTimeout(timer); timer = setTimeout(() => { loadPosts(); loadVotes(); }, 250); };

  return {
    mode: "live", me, canWrite: !!me, isAdmin, role, sample: null, canUpload: !!me,
    async uploadEvidence(blob, kind) {
      const ext = kind === "video" ? (blob.type.split("/")[1] || "mp4") : "jpg";
      const path = `${me}/${crypto.randomUUID()}.${ext}`;
      const { error } = await sb.storage.from("evidence").upload(path, blob, { contentType: blob.type, upsert: false });
      if (error) throw error;
      return { ref: path };
    },
    async mediaUrl(ev) { const { data } = await sb.storage.from("evidence").createSignedUrl(ev.ref, 3600); return data?.signedUrl || ""; },
    async setEvidenceStatus(evId, st, _current, postId) {
      const row = postsById[postId]; if (!row) return;
      const evidence = (row.evidence || []).map((e) => (e.id === evId ? { ...e, status: st } : e));
      await sb.from("posts").update({ evidence }).eq("id", postId); refresh();
    },
    subscribe(h) {
      handlers = h; loadPosts(); loadVotes();
      const ch = sb.channel("oyoi").on("postgres_changes", { event: "*", schema: "public", table: "posts" }, refresh).on("postgres_changes", { event: "*", schema: "public", table: "votes" }, refresh).on("postgres_changes", { event: "INSERT", schema: "public", table: "org_responses" }, refresh).subscribe();
      return () => sb.removeChannel(ch);
    },
    async addPost(p) {
      const { data, error } = await sb.from("posts").insert({ type: p.type, cat: p.cat, sub: p.sub || null, entity: p.entity, city: p.city, tehsil: p.tehsil || null, district: p.district || null, state: p.state, rating: p.rating, severity: p.severity, title: p.title, body: p.body, anon: p.anon, visibility: p.visibility, lang: p.lang || null, evidence: (p.evidence || []).map((e) => ({ ...e, status: "pending" })), sector: p.sector || "government", organization_id: p.organizationId || null, experience_date: p.experienceDate || null, suggestion: p.suggestion || null, service_location: p.serviceLocation || null }).select().single();
      if (error) throw error;
      refresh(); return toPost(data);
    },
    async toggle(kind, id) {
      const k = kind === "flags" ? "flag" : kind === "helpful" ? "helpful" : "metoo";
      const has = (mineVotes[kind] || []).includes(id);
      if (has) await sb.from("votes").delete().match({ post_id: id, user_id: me, kind: k });
      else await sb.from("votes").insert({ post_id: id, kind: k });
      refresh();
    },
    async searchOrgs(q, sector) {
      let query = sb.from("organizations").select("id, name, sector, category, state, city, verified, website").eq("status", "published").order("verified", { ascending: false }).limit(8);
      if (sector) query = query.eq("sector", sector);
      if (q && q.trim()) query = query.ilike("name", `%${q.trim().replace(/[%_]/g, "")}%`);
      const { data, error } = await query; if (error) throw error; return data || [];
    },
    async suggestOrg(o) {
      const row = { name: o.name.trim(), sector: o.sector, category: o.category || null, state: o.state || null, city: o.city || null, created_by: me };
      const { data, error } = await sb.from("organizations").insert(row).select("id").single();
      if (error) {
        if (/duplicate/i.test(error.message)) { const { data: ex } = await sb.from("organizations").select("id").eq("sector", o.sector).ilike("name", row.name).limit(1); return ex?.[0]?.id || null; }
        throw error;
      }
      return data.id;
    },
    async setStatus(id, status) { await sb.from("posts").update({ status }).eq("id", id); refresh(); },
    async setHidden(id, hidden) { await sb.from("posts").update({ hidden }).eq("id", id); refresh(); },
    async respond(id, text) { await sb.from("posts").update({ response: text, response_at: new Date().toISOString() }).eq("id", id); refresh(); },
    async names(ids) {
      const { data } = await sb.from("profiles").select("id, display_name").in("id", ids);
      return Object.fromEntries((data || []).map((r) => [r.id, r.display_name || ""]));
    },
    async getProfile() {
      if (!me) return null;
      const [{ data: pub }, { data: priv }] = await Promise.all([
        sb.from("profiles").select("display_name").eq("id", me).maybeSingle(),
        sb.from("profile_details").select("*").eq("id", me).maybeSingle(),
      ]);
      if (!priv) return pub?.display_name ? { displayName: pub.display_name } : null;
      return { displayName: pub?.display_name || "", fullName: priv.full_name, gender: priv.gender, age: priv.age, completed: true };
    },
    async saveProfile(p) {
      const a = await sb.from("profiles").upsert({ id: me, display_name: p.displayName });
      if (a.error) throw a.error;
      const b = await sb.from("profile_details").upsert({ id: me, full_name: p.fullName, gender: p.gender, age: p.age, updated_at: new Date().toISOString() });
      if (b.error) throw b.error;
    },
    auth: {
      preview: false,
      signedIn: !!me,
      method: session?.user?.app_metadata?.provider || "",
      async oauth(provider) {
        const map = { google: "google", facebook: "facebook", linkedin: "linkedin_oidc" };
        const { error } = await sb.auth.signInWithOAuth({ provider: map[provider], options: { redirectTo: location.origin } });
        if (error) throw error;
      },
      async sendEmailOtp(email, create = true) {
        const { error } = await sb.auth.signInWithOtp({ email, options: { shouldCreateUser: create } });
        if (error) throw new Error(!create && /signups|not found|not allowed/i.test(error.message) ? "No account found for this email. Choose Sign up instead." : error.message);
      },
      async verifyEmailOtp(email, token) { let { error } = await sb.auth.verifyOtp({ email, token, type: "email" }); if (error) ({ error } = await sb.auth.verifyOtp({ email, token, type: "signup" })); if (error) throw error; location.reload(); },
      async sendOtp(phone, create = true) {
        const { error } = await sb.auth.signInWithOtp({ phone, options: { shouldCreateUser: create } });
        if (error) throw new Error(!create && /signups|not found|not allowed/i.test(error.message) ? "No account found for this number. Choose Sign up instead." : error.message);
      },
      async verifyOtp(phone, token) {
        const { error } = await sb.auth.verifyOtp({ phone, token, type: "sms" });
        if (error) throw error;
        location.reload();
      },
      async signOut() { await sb.auth.signOut(); location.reload(); },
    },
  };
}
