/*
 * Data layer. In the published artifact it uses the viewer's realtime `db`
 * capability; anywhere else it falls back to an in-memory demo store.
 * For production, swap this file for Firebase, Supabase or your own API.
 *
 * Layout
 *   posts/<authorId>          { items: Post[] }          public posts, each person writes only their own doc
 *   votes/<voterId>           { metoo: id[], flags: id[] }
 *   moderation/status         { map: { [postId]: status } }   editors only
 *   moderation/hidden         { map: { [postId]: true } }     editors only
 *   moderation/responses      { map: { [postId]: { text, by, at } } } editors only
 *   moderation/evidence       { map: { [evidenceId]: "approved" | "rejected" } } editors only
 * Evidence files live in the artifact's asset store (served at /_blob/<id>).
 *   data/users/<id>/private   { items: Post[] }          private feedback, visible only to its author
 */
import { uid } from "./data.js";

/* Preview sign in: the Claude preview already knows who you are, so these buttons only
   demonstrate the production flow. Real Google, Facebook, LinkedIn, email and mobile OTP
   sign in runs in store.supabase.js. */
function previewAuth() {
  const read = () => { try { return localStorage.getItem("oyoi-demo-signin") || ""; } catch { return ""; } };
  const write = (v) => { try { v ? localStorage.setItem("oyoi-demo-signin", v) : localStorage.removeItem("oyoi-demo-signin"); } catch { /* ignore */ } };
  return {
    preview: true,
    get signedIn() { return !!read(); },
    get method() { return read(); },
    async oauth(provider) { write(provider); },
    async sendOtp() {}, async verifyOtp(_p, code) { if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6 digit code"); write("phone"); },
    async sendEmailOtp() {}, async verifyEmailOtp(_e, code) { if (!/^\d{6}$/.test(code)) throw new Error("Enter the 6 digit code"); write("email"); },
    async signOut() { write(""); },
  };
}

export async function connect() {
  if (import.meta.env.VITE_SUPABASE_URL) {
    const m = await import("./store.supabase.js");
    return m.connectSupabase();
  }
  const c = typeof window !== "undefined" ? window.claude : undefined;
  let db = null, user = null;
  try { db = c?.use ? await c.use("db") : null; } catch { db = null; }
  try { user = c?.use ? await c.use("user") : null; } catch { user = null; }
  let assets = null;
  try { assets = c?.use ? await c.use("assets") : null; } catch { assets = null; }
  let sample = null;
  try { sample = c?.use ? await c.use("sample") : null; } catch { sample = null; }
  const me = user ? await user.id().catch(() => null) : null;
  const canWrite = user ? await user.can("data.write").catch(() => null) : null;
  const isAdmin = user ? await user.canEdit().catch(() => false) : false;
  return db && me ? live(db, user, me, canWrite, isAdmin, sample, assets) : local(sample);
}

function live(db, user, me, canWrite, isAdmin, sample, assets) {
  let myPosts = [], myVotes = { metoo: [], flags: [] }, myPrivate = [];
  const subs = [];
  const api = {
    mode: "live", me, canWrite: canWrite !== false, isAdmin, sample, canUpload: !!assets,
    subscribe({ onPosts, onVotes, onStatus, onPrivate, onHidden, onResponses, onEvidence, onError }) {
      subs.push(db.collection("posts").onSnapshot((snap) => {
        const all = [];
        snap.docs.forEach((d) => { const items = d.data()?.items; if (Array.isArray(items)) items.forEach((p) => all.push({ ...p, authorId: d.id === "community" ? null : d.id })); if (d.id === me) myPosts = Array.isArray(items) ? items : []; });
        onPosts(all);
      }, (e) => onError?.(e)));
      subs.push(db.collection("votes").onSnapshot((snap) => {
        const metoo = {}, flags = {};
        snap.docs.forEach((d) => {
          const v = d.data() || {};
          (v.metoo || []).forEach((id) => (metoo[id] = (metoo[id] || 0) + 1));
          (v.flags || []).forEach((id) => (flags[id] = (flags[id] || 0) + 1));
          if (d.id === me) myVotes = { metoo: v.metoo || [], flags: v.flags || [] };
        });
        onVotes({ metoo, flags, mine: myVotes });
      }, (e) => onError?.(e)));
      subs.push(db.doc("moderation/status").onSnapshot((s) => onStatus(s.data()?.map || {}), (e) => onError?.(e)));
      subs.push(db.doc("moderation/hidden").onSnapshot((s) => onHidden?.(s.data()?.map || {}), () => {}));
      subs.push(db.doc("moderation/responses").onSnapshot((s) => onResponses?.(s.data()?.map || {}), () => {}));
      subs.push(db.doc("moderation/evidence").onSnapshot((s) => onEvidence?.(s.data()?.map || {}), () => {}));
      subs.push(db.doc(`data/users/${me}/private`).onSnapshot((s) => { myPrivate = s.data()?.items || []; onPrivate(myPrivate); }, () => {}));
      return () => subs.splice(0).forEach((u) => u());
    },
    async addPost(post) {
      const p = { ...post, id: uid(), createdAt: new Date().toISOString() };
      if (post.visibility === "private") { myPrivate = [p, ...myPrivate].slice(0, 200); await db.doc(`data/users/${me}/private`).set({ items: myPrivate }); }
      else { myPosts = [p, ...myPosts].slice(0, 200); await db.doc(`posts/${me}`).set({ items: myPosts }); }
      return p;
    },
    async toggle(kind, id) {
      const list = myVotes[kind] || [];
      myVotes = { ...myVotes, [kind]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id].slice(-2000) };
      await db.doc(`votes/${me}`).set(myVotes);
    },
    async setStatus(id, status, current) { await db.doc("moderation/status").set({ map: { ...current, [id]: status } }); },
    async setHidden(id, hidden, current) { const map = { ...current }; if (hidden) map[id] = true; else delete map[id]; await db.doc("moderation/hidden").set({ map }); },
    async uploadEvidence(blob, kind) {
      if (!assets) throw new Error("Uploads need Contributor access to this page.");
      const r = await assets.upload(blob, { type: blob.type || (kind === "video" ? "video/mp4" : "image/jpeg") });
      return { ref: r.id };
    },
    mediaUrl: (ev) => `/_blob/${ev.ref}`,
    async setEvidenceStatus(evId, st, current) { await db.doc("moderation/evidence").set({ map: { ...current, [evId]: st } }); },
    async respond(id, text, current) { await db.doc("moderation/responses").set({ map: { ...current, [id]: { text, at: new Date().toISOString() } } }); },
    auth: previewAuth(),
    async getProfile() { const d = await db.doc(`data/users/${me}/profile`).get(); return d.exists ? d.data() : null; },
    async saveProfile(p) { await db.doc(`data/users/${me}/profile`).set({ ...p, completed: true, updatedAt: new Date().toISOString() }); },
    async names(ids) { try { const ps = await user.profiles(ids); return Object.fromEntries(Object.entries(ps).map(([k, v]) => [k, v.name || ""])); } catch { return {}; } },
  };
  return api;
}

function local(sample) {
  let posts = [], votes = { metoo: {}, flags: {}, mine: { metoo: [], flags: [] } }, status = {}, priv = [], hidden = {}, responses = {}, evid = {};
  let h = {};
  const emit = () => { h.onPosts?.(posts); h.onVotes?.(votes); h.onStatus?.(status); h.onPrivate?.(priv); h.onHidden?.(hidden); h.onResponses?.(responses); h.onEvidence?.(evid); };
  return {
    mode: "local", me: "me", canWrite: true, isAdmin: true, sample, canUpload: true,
    async uploadEvidence(blob) { return { ref: URL.createObjectURL(blob) }; },
    mediaUrl: (ev) => ev.ref,
    async setEvidenceStatus(evId, st) { evid = { ...evid, [evId]: st }; emit(); },
    subscribe(handlers) { h = handlers; emit(); return () => (h = {}); },
    async addPost(post) {
      const p = { ...post, id: uid(), createdAt: new Date().toISOString(), authorId: "me" };
      if (post.visibility === "private") priv = [p, ...priv]; else posts = [p, ...posts];
      emit(); return p;
    },
    async toggle(kind, id) {
      const mine = votes.mine[kind]; const has = mine.includes(id);
      votes = { ...votes, [kind]: { ...votes[kind], [id]: (votes[kind][id] || 0) + (has ? -1 : 1) }, mine: { ...votes.mine, [kind]: has ? mine.filter((x) => x !== id) : [...mine, id] } };
      emit();
    },
    async setStatus(id, s) { status = { ...status, [id]: s }; emit(); },
    async setHidden(id, v) { hidden = { ...hidden }; if (v) hidden[id] = true; else delete hidden[id]; emit(); },
    async respond(id, text) { responses = { ...responses, [id]: { text, at: new Date().toISOString() } }; emit(); },
    auth: previewAuth(),
    async getProfile() { try { return JSON.parse(localStorage.getItem("oyoi-profile") || "null"); } catch { return null; } },
    async saveProfile(p) { try { localStorage.setItem("oyoi-profile", JSON.stringify({ ...p, completed: true })); } catch { /* ignore */ } },
    async names() { return { me: "You" }; },
  };
}
