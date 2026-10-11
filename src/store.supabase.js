/*
 * Production data layer on Supabase (Postgres + Realtime + Auth).
 * Activated when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build time.
 * Run supabase/schema.sql in your project first. Phone OTP needs an SMS provider
 * (for example MSG91 or Twilio) configured under Authentication > Providers > Phone.
 */
import { createClient } from "@supabase/supabase-js";

const toPost = (r) => ({
  id: r.id, type: r.type, cat: r.cat, sub: r.sub, entity: r.entity, city: r.city, tehsil: r.tehsil, district: r.district, state: r.state,
  rating: r.rating, severity: r.severity, title: r.title, body: r.body, anon: r.anon, visibility: r.visibility,
  createdAt: r.created_at, authorId: r.anon ? null : r.author_id, ownerId: r.author_id, sample: r.sample, evidence: r.evidence || [], lang: r.lang,
});

export async function connectSupabase() {
  const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  const { data: { session } } = await sb.auth.getSession();
  const me = session?.user?.id || null;
  let isAdmin = false;
  if (me) {
    const { data } = await sb.from("profiles").select("role").eq("id", me).maybeSingle();
    isAdmin = ["moderator", "admin"].includes(data?.role);
  }
  let mineVotes = { metoo: [], flags: [] };
  let handlers = {};
  let timer = null;
  let postsById = {};

  async function loadPosts() {
    const { data, error } = await sb.from("posts").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) return handlers.onError?.(error);
    const rows = data || [];
    const status = {}, hidden = {}, responses = {}, evid = {};
    rows.forEach((r) => { (r.evidence || []).forEach((e) => { if (e.status && e.status !== "pending") evid[e.id] = e.status; }); status[r.id] = r.status; if (r.hidden) hidden[r.id] = true; if (r.response) responses[r.id] = { text: r.response, at: r.response_at }; });
    handlers.onPosts?.(rows.filter((r) => r.visibility === "public").map(toPost));
    handlers.onPrivate?.(rows.filter((r) => r.visibility === "private" && r.author_id === me).map(toPost));
    handlers.onStatus?.(status); handlers.onHidden?.(hidden); handlers.onResponses?.(responses); handlers.onEvidence?.(evid);
    postsById = Object.fromEntries(rows.map((r) => [r.id, r]));
  }
  async function loadVotes() {
    const { data } = await sb.from("vote_counts").select("*");
    const metoo = {}, flags = {};
    (data || []).forEach((r) => { if (r.kind === "metoo") metoo[r.post_id] = r.n; else flags[r.post_id] = r.n; });
    if (me) {
      const { data: mine } = await sb.from("votes").select("post_id, kind").eq("user_id", me);
      mineVotes = { metoo: (mine || []).filter((v) => v.kind === "metoo").map((v) => v.post_id), flags: (mine || []).filter((v) => v.kind === "flag").map((v) => v.post_id) };
    }
    handlers.onVotes?.({ metoo, flags, mine: mineVotes });
  }
  const refresh = () => { clearTimeout(timer); timer = setTimeout(() => { loadPosts(); loadVotes(); }, 250); };

  return {
    mode: "live", me, canWrite: !!me, isAdmin, sample: null, canUpload: !!me,
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
      const ch = sb.channel("oyoi").on("postgres_changes", { event: "*", schema: "public", table: "posts" }, refresh).on("postgres_changes", { event: "*", schema: "public", table: "votes" }, refresh).subscribe();
      return () => sb.removeChannel(ch);
    },
    async addPost(p) {
      const { data, error } = await sb.from("posts").insert({ type: p.type, cat: p.cat, sub: p.sub || null, entity: p.entity, city: p.city, tehsil: p.tehsil || null, district: p.district || null, state: p.state, rating: p.rating, severity: p.severity, title: p.title, body: p.body, anon: p.anon, visibility: p.visibility, lang: p.lang || null, evidence: (p.evidence || []).map((e) => ({ ...e, status: "pending" })) }).select().single();
      if (error) throw error;
      refresh(); return toPost(data);
    },
    async toggle(kind, id) {
      const k = kind === "flags" ? "flag" : "metoo";
      const has = (mineVotes[kind] || []).includes(id);
      if (has) await sb.from("votes").delete().match({ post_id: id, user_id: me, kind: k });
      else await sb.from("votes").insert({ post_id: id, kind: k });
      refresh();
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
      async verifyEmailOtp(email, token) { const { error } = await sb.auth.verifyOtp({ email, token, type: "email" }); if (error) throw error; location.reload(); },
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
