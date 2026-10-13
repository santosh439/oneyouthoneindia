import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCircle2, Clock, FileText, Hourglass, Loader2, LogIn, Plus, Search, Undo2, Activity, Landmark, ShoppingBag, Globe2, RotateCcw, BadgeCheck, Lightbulb, Send, Building2 } from "lucide-react";
import { catById } from "../data.js";
import { session, myFeedback, feedbackEvents, myNotifications, markAllRead, withdraw, live, fmt, place, WORKFLOW, STATUS_LABEL, orgResponsesFor, requestFurtherReview, myOrgs, orgFeedback, orgRespond, orgsByIds } from "./api.js";
import { Shell, Kpi, StatusBadge, PubBadge, Timeline, Drawer, Empty, Card, Input, Select, Btn } from "./ui.jsx";

const inProgress = ["Under review", "Assigned", "Action in progress"];
const GROUPS = {
  all: () => true,
  government: (p) => (p.sector || "government") === "government",
  private: (p) => p.sector === "private",
  published: (p) => p.visibility === "public" && p.publication === "approved" && !p.withdrawn,
  pending: (p) => p.visibility === "public" && p.publication === "pending" && !p.withdrawn,
  awaiting: (p) => p.status === "Response awaited",
  progress: (p) => inProgress.includes(p.status),
  outcome: (p) => ["Outcome provided", "Closed"].includes(p.status),
};

export default function Dashboard() {
  const [me, setMe] = useState(undefined);
  const [rows, setRows] = useState(null);
  const [notes, setNotes] = useState([]);
  const [err, setErr] = useState("");
  const [group, setGroup] = useState("all");
  const [q, setQ] = useState("");
  const [st, setSt] = useState("all");
  const [open, setOpen] = useState(null);
  const [showBell, setShowBell] = useState(false);

  const load = useCallback(async (uid) => {
    try { const [f, n] = await Promise.all([myFeedback(uid), myNotifications(uid)]); setRows(f); setNotes(n); setErr(""); }
    catch (e) { setErr(e.message); setRows([]); }
  }, []);
  useEffect(() => { session().then((s) => { setMe(s); if (s.user) load(s.user.id); }); }, [load]);
  useEffect(() => (me?.user ? live(() => load(me.user.id)) : undefined), [me, load]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (rows || []).filter(GROUPS[group]).filter((p) => st === "all" || p.status === st)
      .filter((p) => !t || `${p.ref_no} ${p.title} ${p.entity} ${place(p)} ${catById(p.cat).name}`.toLowerCase().includes(t));
  }, [rows, group, q, st]);
  const count = (g) => (rows || []).filter(GROUPS[g]).length;
  const unread = notes.filter((n) => !n.read).length;
  const rated = (rows || []).filter((p) => p.rating);
  const myAvg = rated.length ? (rated.reduce((a, p) => a + p.rating, 0) / rated.length).toFixed(1) : null;

  if (me === undefined) return <Shell title="My Voice Dashboard"><p className="flex items-center gap-2 text-mute"><Loader2 className="animate-spin" size={18} />Loading</p></Shell>;
  if (!me.user) return (
    <Shell title="My Voice Dashboard" subtitle="Your feedback, in one place">
      <Card><p className="text-[15px]">Sign in to see and track the feedback you have shared.</p><a href="/?signin=1" className="focusable mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-indigo px-5 text-[14px] font-bold text-white"><LogIn size={17} />Sign in</a></Card>
    </Shell>
  );

  const bell = (
    <div className="relative">
      <button onClick={() => { setShowBell(!showBell); if (unread) markAllRead(me.user.id).then(() => load(me.user.id)); }} className="focusable relative rounded-full p-2.5 text-mute hover:bg-raised" aria-label={`Notifications, ${unread} unread`}>
        <Bell size={18} />{unread > 0 && <span className="absolute right-1 top-1 rounded-full bg-ruby px-1.5 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {showBell && (
        <div className="absolute right-0 top-12 z-40 w-[340px] rounded-2xl border hair2 bg-card p-3 shadow-2xl">
          <p className="px-2 pb-2 text-[13px] font-bold">Notifications</p>
          <ul className="max-h-[360px] space-y-1 overflow-y-auto">
            {notes.map((n) => <li key={n.id}><button onClick={() => { setShowBell(false); const p = (rows || []).find((r) => r.id === n.post_id); if (p) setOpen(p); }} className="focusable w-full rounded-xl p-2.5 text-left hover:bg-raised"><p className="text-[13px] font-semibold">{n.title}</p>{n.body && <p className="line-clamp-2 text-[12.5px] text-mute">{n.body}</p>}<p className="mt-0.5 text-[11px] text-faint">{fmt(n.created_at)}</p></button></li>)}
            {!notes.length && <li className="p-3 text-[13px] text-mute">No notifications yet.</li>}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <Shell title="My Voice Dashboard" subtitle={`Namaste${me.profile?.display_name ? `, ${me.profile.display_name}` : ""}`} right={bell}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <p className="flex-1 text-[14.5px] text-mute">Follow every experience you have shared: its Feedback Progress, responses and outcomes. Updates appear here in real time.</p>
        <a href="/?compose=1" className="focusable inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-bold text-bg"><Plus size={17} />Share Your Experience</a>
      </div>
      {err && <p className="mb-4 rounded-2xl bg-ruby/10 p-3 text-[13.5px] text-ruby">{err}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["all", "Experiences shared", FileText, undefined, myAvg ? `Your average rating ${myAvg}` : undefined], ["government", "Public service", Landmark, "#3B3FD8"], ["private", "Consumer", ShoppingBag, "#7C3AED"], ["published", "Published", Globe2, "#13A86B"],
          ["pending", "Awaiting moderation", Hourglass, "#FF7A2F"], ["awaiting", "Awaiting response", Clock, "#D9467F"], ["progress", "In progress", Activity, "#F5B400"], ["outcome", "Outcomes received", CheckCircle2, "#13A86B"]].map(([k, l, I, c, h]) => (
          <Kpi key={k} label={l} value={count(k)} icon={I} color={c} hint={h} onClick={() => setGroup(k)} active={group === k} />))}
      </div>

      <Card title="My Feedback Journey" className="mt-6" action={<span className="text-[12.5px] text-faint">{list.length} shown</span>}>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3.5 top-3 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by Feedback Reference ID, title or place" className="w-full pl-10" aria-label="Search my feedback" /></div>
          <Select value={st} onChange={(e) => setSt(e.target.value)} aria-label="Filter by status"><option value="all">All progress stages</option>{WORKFLOW.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</Select>
        </div>
        {rows === null ? <p className="flex items-center gap-2 text-mute"><Loader2 className="animate-spin" size={16} />Loading your feedback</p>
          : !list.length ? <Empty text={rows.length ? "No feedback matches these filters." : "You have not shared any feedback yet."} />
          : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[920px] text-left text-[13px]">
              <thead><tr className="border-b hair2 text-[11.5px] uppercase tracking-wide text-faint">{["Feedback Reference ID", "Submitted", "Title", "Category", "Location", "Rating", "Feedback Progress", "Visibility", "Last updated", ""].map((h) => <th key={h} className="py-2.5 pr-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b hair align-top hover:bg-raised/60">
                    <td className="whitespace-nowrap py-3 pr-3 font-mono text-[12px] font-semibold">{p.ref_no}</td>
                    <td className="py-3 pr-3 whitespace-nowrap text-mute">{fmt(p.created_at)}</td>
                    <td className="max-w-[240px] py-3 pr-3 font-semibold">{p.title}</td>
                    <td className="py-3 pr-3">{catById(p.cat).name}<span className="block text-[11.5px] text-faint">{p.sector === "private" ? "Consumer" : "Public service"}</span></td>
                    <td className="py-3 pr-3 text-mute">{place(p)}</td>
                    <td className="py-3 pr-3">{p.rating ? `${p.rating} / 5` : "—"}</td>
                    <td className="py-3 pr-3"><StatusBadge s={p.status} /></td>
                    <td className="py-3 pr-3"><PubBadge p={p.visibility === "private" ? "private" : p.publication} withdrawn={p.withdrawn} /></td>
                    <td className="py-3 pr-3 whitespace-nowrap text-mute">{fmt(p.updated_at)}</td>
                    <td className="py-3"><Btn tone="soft" className="h-8 px-3 text-[12.5px]" onClick={() => setOpen(p)}>View</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {me.role === "org_rep" && <OrgInbox uid={me.user.id} />}
      {open && <Detail p={(rows || []).find((r) => r.id === open.id) || open} onClose={() => setOpen(null)} onChanged={() => load(me.user.id)} />}
    </Shell>
  );
}

function Detail({ p, onClose, onChanged }) {
  const [events, setEvents] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [replies, setReplies] = useState([]);
  const [org, setOrg] = useState(null);
  useEffect(() => { setEvents(null); feedbackEvents(p.id).then(setEvents).catch((e) => { setEvents([]); setMsg(e.message); }); orgResponsesFor([p.id]).then(setReplies).catch(() => setReplies([])); }, [p.id, p.updated_at]);
  useEffect(() => { if (p.organization_id) orgsByIds([p.organization_id]).then((o) => setOrg(o[0] || null)).catch(() => {}); }, [p.organization_id]);
  const canWithdraw = !p.withdrawn && !["Outcome provided", "Closed"].includes(p.status);
  const daysSince = (Date.now() - new Date(p.status_changed_at || p.updated_at)) / 864e5;
  const canReview = ["Outcome provided", "Closed"].includes(p.status) && daysSince <= 30 && (p.further_reviews || 0) < 2 && !p.withdrawn;
  const askReview = async () => {
    const reason = prompt("Request Further Review: briefly explain what is still unresolved (at least 10 characters).");
    if (reason === null) return;
    setBusy(true); try { await requestFurtherReview(p.id, reason); setMsg(""); onChanged(); } catch (e) { setMsg(e.message); } setBusy(false);
  };
  const doWithdraw = async () => {
    const reason = prompt("Withdraw this feedback? It stays in your history but is removed from public view. Optional reason:");
    if (reason === null) return;
    setBusy(true); try { await withdraw(p.id, reason); onChanged(); } catch (e) { setMsg(e.message); } setBusy(false);
  };
  return (
    <Drawer title={p.ref_no} onClose={onClose} footer={(canWithdraw || canReview) && <div className="flex flex-wrap gap-2">{canReview && <Btn onClick={askReview} disabled={busy}><RotateCcw size={15} />Request Further Review</Btn>}{canWithdraw && <Btn tone="soft" onClick={doWithdraw} disabled={busy}><Undo2 size={15} />Withdraw feedback</Btn>}</div>}>
      <div className="flex flex-wrap gap-2"><StatusBadge s={p.status} /><PubBadge p={p.visibility === "private" ? "private" : p.publication} withdrawn={p.withdrawn} /></div>
      <h3 className="mt-3 font-display text-[22px] font-bold leading-tight">{p.title}</h3>
      <p className="mt-1 text-[13px] text-mute">{p.sector === "private" ? "Consumer Experience" : "Public Service Experience"} · {catById(p.cat).name}{p.sub ? ` · ${p.sub}` : ""} · <span className="inline-flex items-center gap-1">{org?.name || p.entity}{org?.verified && <BadgeCheck size={13} className="text-leaf" />}</span>{p.service_location ? ` · ${p.service_location}` : ""} · {place(p)}</p>
      <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed">{p.body}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-raised p-4 text-[13px]">
        <div><dt className="text-faint">Submitted</dt><dd className="font-semibold">{fmt(p.created_at)}</dd></div>
        <div><dt className="text-faint">Last updated</dt><dd className="font-semibold">{fmt(p.updated_at)}</dd></div>
        {p.rating && <div><dt className="text-faint">Rating</dt><dd className="font-semibold">{p.rating} / 5</dd></div>}
        {p.severity && <div><dt className="text-faint">Severity</dt><dd className="font-semibold">{p.severity}</dd></div>}
        {p.experience_date && <div><dt className="text-faint">Date of experience</dt><dd className="font-semibold">{fmt(p.experience_date)}</dd></div>}
        {p.further_reviews > 0 && <div><dt className="text-faint">Further reviews requested</dt><dd className="font-semibold">{p.further_reviews} of 2</dd></div>}
        <div><dt className="text-faint">Shown as</dt><dd className="font-semibold">{p.anon ? "Anonymous" : "Your display name"}</dd></div>
        <div><dt className="text-faint">Attachments</dt><dd className="font-semibold">{(p.evidence || []).length}</dd></div>
      </dl>
      {p.suggestion && <p className="mt-5 flex items-start gap-2 rounded-2xl bg-sun/10 p-3 text-[13.5px]"><Lightbulb size={16} className="mt-0.5 shrink-0" /><span><b>Your suggested improvement:</b> {p.suggestion}</span></p>}
      {replies.map((r) => <div key={r.id} className="mt-5 rounded-2xl border border-indigo/30 bg-indigo/5 p-4"><p className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wide text-indigo"><BadgeCheck size={14} />Response from {org?.name || "the organisation"} (verified representative)</p><p className="mt-1.5 whitespace-pre-wrap text-[14px]">{r.body}</p><p className="mt-1 text-[11.5px] text-faint">{fmt(r.created_at)}</p></div>)}
      {p.response && <div className="mt-5 rounded-2xl border border-leaf/30 bg-leaf/5 p-4"><p className="text-[12px] font-bold uppercase tracking-wide text-leaf">Response from One Youth One India</p><p className="mt-1.5 text-[14px]">{p.response}</p><p className="mt-1 text-[11.5px] text-faint">{fmt(p.response_at)}</p></div>}
      {p.publication === "pending" && p.visibility === "public" && !p.withdrawn && <p className="mt-5 flex items-start gap-2 rounded-2xl bg-sun/15 p-3 text-[13px]"><Clock size={16} className="mt-0.5 shrink-0" />A moderator reviews new feedback before it appears on the public site. You can track it here meanwhile.</p>}
      {msg && <p className="mt-4 rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
      <h4 className="mb-3 mt-7 font-display text-[16px] font-bold">Activity</h4>
      <Timeline events={events} />
    </Drawer>
  );
}

/* Organisation representatives: respond to published feedback about their verified organisation.
 * They cannot edit, hide or change the progress of any feedback. */
function OrgInbox({ uid }) {
  const [orgs, setOrgs] = useState(null);
  const [rows, setRows] = useState([]);
  const [replies, setReplies] = useState({});
  const [draft, setDraft] = useState({});
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(null);
  const load = useCallback(async () => {
    try {
      const o = await myOrgs(uid); setOrgs(o);
      const f = await orgFeedback(o.map((x) => x.id)); setRows(f);
      const r = await orgResponsesFor(f.map((x) => x.id));
      setReplies(r.reduce((a, x) => ({ ...a, [x.post_id]: [...(a[x.post_id] || []), x] }), {}));
    } catch (e) { setMsg(e.message); setOrgs([]); }
  }, [uid]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => live(load), [load]);
  const send = async (id) => {
    const body = (draft[id] || "").trim(); if (body.length < 10) return setMsg("Write at least 10 characters.");
    setBusy(id); try { await orgRespond(id, body); setDraft((d) => ({ ...d, [id]: "" })); setMsg(""); await load(); } catch (e) { setMsg(e.message); } setBusy(null);
  };
  return (
    <Card title="Organisation inbox" className="mt-6" action={<span className="text-[12.5px] text-faint">{orgs ? orgs.map((o) => o.name).join(", ") : ""}</span>}>
      <p className="-mt-2 mb-4 text-[13px] text-mute">Published feedback about your organisation. Your reply appears publicly as a verified response and the person who shared it is notified. You cannot edit, hide or close feedback.</p>
      {msg && <p className="mb-3 rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
      {orgs === null ? <Loader2 className="animate-spin" size={16} /> : !orgs.length ? <Empty icon={Building2} text="No organisation is linked to your account yet. An administrator links representatives after verifying them." /> : !rows.length ? <Empty text="No published feedback about your organisation yet." /> : (
        <ul className="space-y-3">{rows.map((p) => (
          <li key={p.id} className="rounded-2xl border hair2 p-4">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[12px] font-semibold">{p.ref_no}</span><StatusBadge s={p.status} />{p.rating && <span className="text-[12.5px] font-bold">{p.rating} / 5</span>}<span className="ml-auto text-[12px] text-faint">{fmt(p.created_at)}</span></div>
            <p className="mt-2 font-semibold">{p.title}</p><p className="mt-1 whitespace-pre-wrap text-[13.5px] text-mute">{p.body}</p>
            {p.suggestion && <p className="mt-2 text-[13px]"><b>Suggested improvement:</b> {p.suggestion}</p>}
            {(replies[p.id] || []).map((r) => <p key={r.id} className="mt-3 rounded-xl bg-indigo/5 p-3 text-[13px]"><b className="text-indigo">Your response · {fmt(r.created_at)}:</b> {r.body}</p>)}
            <div className="mt-3 flex gap-2"><textarea rows={2} value={draft[p.id] || ""} onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))} placeholder="Write a public response" maxLength={2000} aria-label={`Response to ${p.ref_no}`} className="focusable flex-1 rounded-2xl border hair2 bg-card p-3 text-[13.5px] outline-none" />
              <Btn onClick={() => send(p.id)} disabled={busy === p.id} className="self-end"><Send size={15} />Respond</Btn></div>
          </li>))}</ul>
      )}
    </Card>
  );
}
