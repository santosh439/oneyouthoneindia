import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, Lightbulb, LayoutDashboard, ListChecks, BarChart3, Users, ScrollText, FileText, RefreshCw, Loader2, LogIn, Search, Download, ShieldAlert, Inbox, Clock, CheckCircle2, AlertTriangle, Eye, EyeOff, Send, StickyNote, UserCheck, Copy, Lock, Check, X, Activity, Hourglass } from "lucide-react";
import { catById, STATES, districtsOf, CATEGORIES } from "../data.js";
import { session, queue, staffUpdate, addNote, feedbackEvents, staffDirectory, listUsers, setRole, auditLog, recentEvents, names as getNames, live, toCsv, fmt, place, WORKFLOW, STATUS_LABEL, STATUS_COLOR, PUB_LABEL, ROLES, roleName, STAFF, ADMIN, CONTENT, syncRuns } from "./api.js";
import { ContentTab, SyncTab, runSync } from "./Content.jsx";
import { OrgsTab } from "./Orgs.jsx";
import { BUILD_ID } from "../cms.js";

const FEED = [...STAFF, "analyst"];
const ALLOWED = [...FEED, "content_manager"];
import { Shell, Kpi, StatusBadge, PubBadge, Timeline, Drawer, Empty, Card, Bars, Trend, Input, Select, Btn } from "./ui.jsx";

const DAY = 864e5;
const isOpen = (p) => !["Outcome provided", "Closed"].includes(p.status) && !p.withdrawn;
const ageDays = (p) => Math.floor((Date.now() - new Date(p.created_at)) / DAY);

export default function Admin() {
  const [me, setMe] = useState(undefined);
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState(() => new URLSearchParams(location.search).get("tab") || "");
  const [open, setOpen] = useState(null);
  const [staff, setStaff] = useState([]);
  const [names, setNames] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncTick, setSyncTick] = useState(0);

  // Public feedback is readable by everyone, so limit the queue to the admin's own area here as well.
  const scopeRef = useRef(null);
  const load = useCallback(async () => {
    try {
      const all = await queue(); const sc = scopeRef.current;
      const same = (a, b) => String(a || "").toLowerCase() === String(b || "").toLowerCase();
      setRows(!sc ? all : all.filter((p) => same(p.state, sc.state) && (sc.role !== "district_admin" || same(p.district, sc.district))));
      setErr("");
    } catch (e) { setErr(e.message); setRows([]); }
  }, []);
  useEffect(() => { session().then((s) => {
    setMe(s); setTab((t) => t || (FEED.includes(s.role) ? "overview" : "content"));
    scopeRef.current = ["state_admin", "district_admin"].includes(s.role) ? { role: s.role, state: s.profile?.scope_state, district: s.profile?.scope_district } : null;
    if (s.user && FEED.includes(s.role)) { load(); staffDirectory().then((d) => setStaff(d || [])).catch(() => {}); }
    // Automatic sync: the first time the portal is opened after each deployment.
    if (s.user && CONTENT.includes(s.role)) syncRuns().then(async (r) => { if (!r.length || r[0].build !== BUILD_ID) { setSyncing(true); await runSync("auto"); setSyncing(false); setSyncTick((t) => t + 1); } }).catch(() => setSyncing(false));
  }); }, [load]);
  useEffect(() => (me?.user && FEED.includes(me.role) ? live(load) : undefined), [me, load]);
  useEffect(() => { if (rows) getNames(rows.map((r) => r.author_id).concat(rows.map((r) => r.assigned_to))).then(setNames); }, [rows]);

  if (me === undefined) return <Shell title="Admin portal"><p className="flex items-center gap-2 text-mute"><Loader2 className="animate-spin" size={18} />Checking access</p></Shell>;
  if (!me.user) return <Shell title="Admin portal" subtitle="Admin portal"><Card><p className="text-[15px]">Sign in with your staff account to continue.</p><a href="/?signin=1" className="focusable mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-indigo px-5 text-[14px] font-bold text-white"><LogIn size={17} />Sign in</a></Card></Shell>;
  if (!ALLOWED.includes(me.role)) return <Shell title="Admin portal" subtitle="Access restricted"><Empty icon={Lock} text="Your account does not have an administrative role. Ask a platform administrator to grant access." /></Shell>;

  const isAdmin = ADMIN.includes(me.role);
  const canAct = STAFF.includes(me.role);
  const NAV = [...(FEED.includes(me.role) ? [["overview", "Dashboard", LayoutDashboard], ["feedback", "Public feedback", ListChecks], ["analytics", "Analytics & reports", BarChart3]] : []),
    ...(CONTENT.includes(me.role) ? [["orgs", "Organisations", Building2], ["content", "Website content", FileText], ["sync", "Website Data Sync", RefreshCw]] : []),
    ...(isAdmin ? [["users", "Users & roles", Users], ["audit", "Audit logs", ScrollText]] : [])];
  const go = (t) => { setTab(t); history.replaceState(null, "", `?tab=${t}`); };
  const scope = me.role === "state_admin" ? me.profile?.scope_state : me.role === "district_admin" ? `${me.profile?.scope_district}, ${me.profile?.scope_state}` : "All India";

  const nav = (
    <aside className="sticky top-24 hidden h-fit w-56 shrink-0 lg:block">
      <nav className="space-y-1" aria-label="Admin">
        {NAV.map(([k, l, I]) => <button key={k} onClick={() => go(k)} aria-current={tab === k ? "page" : undefined} className={`focusable flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] font-semibold ${tab === k ? "bg-ink text-bg" : "text-mute hover:bg-raised hover:text-ink"}`}><I size={17} />{l}</button>)}
      </nav>
      <div className="mt-6 rounded-2xl bg-raised p-4 text-[12.5px]"><p className="font-bold">{me.profile?.display_name || me.user.email}</p><p className="text-mute">{roleName(me.role)}</p><p className="mt-1 text-faint">Scope: {FEED.includes(me.role) ? scope : "Website content"}</p></div>
    </aside>
  );
  const mobileNav = (
    <div className="no-scrollbar -mx-4 mb-5 flex gap-1.5 overflow-x-auto px-4 lg:hidden">
      {NAV.map(([k, l]) => <button key={k} onClick={() => go(k)} className={`focusable whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold ${tab === k ? "bg-ink text-bg" : "bg-raised text-mute"}`}>{l}</button>)}
    </div>
  );
  const title = NAV.find((n) => n[0] === tab)?.[1] || "Dashboard";
  return (
    <Shell title="Admin portal" subtitle={title} nav={nav}>
      {mobileNav}
      {syncing && <p className="mb-4 flex items-center gap-2 rounded-2xl bg-indigo/10 p-3 text-[13.5px] text-indigo"><Loader2 size={15} className="animate-spin" />New deployment detected: importing the latest site content for review.</p>}
      {err && <p className="mb-4 rounded-2xl bg-ruby/10 p-3 text-[13.5px] text-ruby">{err}</p>}
      {rows === null && ["overview", "feedback", "analytics"].includes(tab) ? <p className="flex items-center gap-2 text-mute"><Loader2 className="animate-spin" size={16} />Loading records</p> : (
        <>
          {tab === "overview" && <Overview rows={rows} onOpen={setOpen} go={go} />}
          {tab === "feedback" && <Queue rows={rows} names={names} onOpen={setOpen} me={me} />}
          {tab === "analytics" && <Analytics rows={rows} staff={staff} />}
          {tab === "users" && isAdmin && <UsersTab me={me} />}
          {tab === "audit" && isAdmin && <AuditTab />}
          {tab === "content" && CONTENT.includes(me.role) && <ContentTab key={syncTick} me={me} goSync={() => go("sync")} />}
          {tab === "orgs" && CONTENT.includes(me.role) && <OrgsTab me={me} />}
          {tab === "sync" && CONTENT.includes(me.role) && <SyncTab key={syncTick} goContent={() => go("content")} />}
        </>
      )}
      {open && <Case p={(rows || []).find((r) => r.id === open.id) || open} all={rows || []} me={me} canAct={canAct} staff={staff} names={names} onClose={() => setOpen(null)} onChanged={load} />}
    </Shell>
  );
}

/* ---------------- Overview ---------------- */
function Overview({ rows, onOpen, go }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const pendingMod = rows.filter((p) => p.publication === "pending" && p.visibility === "public" && !p.withdrawn);
  const open = rows.filter(isOpen);
  const overdue = open.filter((p) => ageDays(p) > 15);
  const resolved = rows.filter((p) => ["Outcome provided", "Closed"].includes(p.status));
    const rejRate = rows.length ? Math.round((rows.filter((p) => p.further_reviews > 0).length / rows.length) * 100) : 0;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Total submissions" value={rows.length} icon={Inbox} />
        <Kpi label="New today" value={rows.filter((p) => new Date(p.created_at) >= today).length} icon={Activity} color="#FF7A2F" />
        <Kpi label="Awaiting moderation" value={pendingMod.length} icon={Hourglass} color="#B45309" onClick={() => go("feedback")} />
        <Kpi label="Open cases" value={open.length} icon={Clock} color="#3B3FD8" />
        <Kpi label="Outcomes provided" value={resolved.length} icon={CheckCircle2} color="#13A86B" />
        <Kpi label="Overdue (15+ days)" value={overdue.length} icon={AlertTriangle} color="#E5484D" hint={`Further review asked: ${rejRate}%`} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Submissions, last 30 days" className="xl:col-span-2"><Trend items={rows.map((r) => r.created_at)} /></Card>
        <Card title="By status"><Bars rows={WORKFLOW.map((s) => [STATUS_LABEL[s], rows.filter((p) => p.status === s).length, STATUS_COLOR[s]]).filter((r) => r[1])} /></Card>
      </div>
      <Card title="Needs attention" action={<Btn tone="soft" className="h-8 text-[12.5px]" onClick={() => go("feedback")}>Open queue</Btn>}>
        {![...pendingMod, ...overdue].length ? <p className="text-[13.5px] text-mute">Nothing waiting. New submissions appear here in real time.</p> : (
          <ul className="divide-y hair">
            {[...new Map([...overdue, ...pendingMod].map((p) => [p.id, p])).values()].slice(0, 8).map((p) => (
              <li key={p.id}><button onClick={() => onOpen(p)} className="focusable flex w-full items-center gap-3 py-3 text-left hover:bg-raised/60">
                <span className="font-mono text-[12px] font-semibold">{p.ref_no}</span><span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{p.title}</span>
                {ageDays(p) > 15 && isOpen(p) && <span className="rounded-full bg-ruby/10 px-2 py-0.5 text-[11.5px] font-bold text-ruby">{ageDays(p)} days</span>}
                <PubBadge p={p.publication} /><StatusBadge s={p.status} />
              </button></li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Queue ---------------- */
function Queue({ rows, names, onOpen, me }) {
  const [f, setF] = useState({ q: "", sector: "all", status: "all", pub: "all", state: "all", district: "all", cat: "all", mine: false });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v, ...(k === "state" ? { district: "all" } : {}) }));
  const list = useMemo(() => {
    const t = f.q.trim().toLowerCase();
    return rows.filter((p) => (f.status === "all" || p.status === f.status) && (f.pub === "all" || (f.pub === "withdrawn" ? p.withdrawn : p.publication === f.pub && !p.withdrawn))
      && (f.sector === "all" || (p.sector || "government") === f.sector) && (f.state === "all" || p.state === f.state) && (f.district === "all" || p.district === f.district) && (f.cat === "all" || catById(p.cat).id === f.cat)
      && (!f.mine || p.assigned_to === me.user.id)
      && (!t || `${p.ref_no} ${p.title} ${p.entity} ${p.city} ${names[p.author_id] || ""}`.toLowerCase().includes(t)));
  }, [rows, f, names, me]);
  const exportCsv = () => toCsv(list, [["Feedback Reference ID", (p) => p.ref_no], ["Submitted", (p) => p.created_at], ["Type", (p) => p.type], ["Category", (p) => catById(p.cat).name], ["Title", (p) => p.title], ["Place", (p) => p.entity], ["City", (p) => p.city], ["District", (p) => p.district], ["State", (p) => p.state], ["Rating", (p) => p.rating], ["Severity", (p) => p.severity], ["Status", (p) => STATUS_LABEL[p.status]], ["Publication", (p) => (p.withdrawn ? "Withdrawn" : PUB_LABEL[p.publication])], ["Assigned to", (p) => names[p.assigned_to] || ""], ["Last updated", (p) => p.updated_at]]);
  const states = [...new Set(rows.map((r) => r.state))].sort();
  return (
    <Card>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1"><Search size={16} className="absolute left-3.5 top-3 text-faint" /><Input value={f.q} onChange={(e) => set("q", e.target.value)} placeholder="Feedback Reference ID, title, place or user" className="w-full pl-10" aria-label="Search feedback" /></div>
        <Select value={f.status} onChange={(e) => set("status", e.target.value)} aria-label="Status"><option value="all">All statuses</option>{WORKFLOW.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</Select>
        <Select value={f.pub} onChange={(e) => set("pub", e.target.value)} aria-label="Publication"><option value="all">Any visibility</option><option value="pending">Awaiting moderation</option><option value="approved">Public</option><option value="rejected">Not published</option><option value="withdrawn">Withdrawn</option></Select>
        <Select value={f.sector} onChange={(e) => set("sector", e.target.value)} aria-label="Sector"><option value="all">All sectors</option><option value="government">Government feedback</option><option value="private">Private sector feedback</option></Select>
        <Select value={f.cat} onChange={(e) => set("cat", e.target.value)} aria-label="Category"><option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
        <Select value={f.state} onChange={(e) => set("state", e.target.value)} aria-label="State"><option value="all">All states</option>{states.map((s) => <option key={s}>{s}</option>)}</Select>
        {f.state !== "all" && <Select value={f.district} onChange={(e) => set("district", e.target.value)} aria-label="District"><option value="all">All districts</option>{[...new Set(rows.filter((r) => r.state === f.state).map((r) => r.district).filter(Boolean))].sort().map((d) => <option key={d}>{d}</option>)}</Select>}
        <label className="inline-flex h-10 items-center gap-2 rounded-full bg-raised px-3.5 text-[13px] font-semibold"><input type="checkbox" checked={f.mine} onChange={(e) => set("mine", e.target.checked)} />Assigned to me</label>
        <Btn tone="soft" onClick={exportCsv}><Download size={15} />Export CSV</Btn>
      </div>
      {!list.length ? <Empty text="No feedback matches these filters." /> : (
        <div className="-mx-5 overflow-x-auto px-5">
          <table className="w-full min-w-[980px] text-left text-[13px]">
            <thead><tr className="border-b hair2 text-[11.5px] uppercase tracking-wide text-faint">{["Feedback Reference ID", "Submitted", "Title", "Category", "Location", "Submitted by", "Assigned", "Status", "Visibility", "Age"].map((h) => <th key={h} className="py-2.5 pr-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {list.slice(0, 500).map((p) => (
                <tr key={p.id} onClick={() => onOpen(p)} className="cursor-pointer border-b hair align-top hover:bg-raised/60">
                  <td className="whitespace-nowrap py-3 pr-3 font-mono text-[12px] font-semibold"><button className="focusable rounded" onClick={(e) => { e.stopPropagation(); onOpen(p); }}>{p.ref_no}</button></td>
                  <td className="whitespace-nowrap py-3 pr-3 text-mute">{fmt(p.created_at)}</td>
                  <td className="max-w-[260px] py-3 pr-3 font-semibold">{p.title}</td>
                  <td className="py-3 pr-3">{catById(p.cat).name}</td>
                  <td className="py-3 pr-3 text-mute">{place(p)}</td>
                  <td className="py-3 pr-3">{p.anon ? <span className="text-mute">Anonymous</span> : names[p.author_id] || "—"}</td>
                  <td className="py-3 pr-3 text-mute">{names[p.assigned_to] || "—"}</td>
                  <td className="py-3 pr-3"><StatusBadge s={p.status} /></td>
                  <td className="py-3 pr-3"><PubBadge p={p.visibility === "private" ? "private" : p.publication} withdrawn={p.withdrawn} /></td>
                  <td className={`py-3 tab ${isOpen(p) && ageDays(p) > 15 ? "font-bold text-ruby" : "text-mute"}`}>{ageDays(p)}d</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length > 500 && <p className="mt-3 text-[12.5px] text-faint">Showing the first 500 of {list.length}. Narrow the filters or export CSV for the full list.</p>}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Case management drawer ---------------- */
function Case({ p, all, me, canAct, staff, names, onClose, onChanged }) {
  const [events, setEvents] = useState(null);
  const [evNames, setEvNames] = useState({});
  const [status, setStatus] = useState(p.status);
  const [reason, setReason] = useState("");
  const [response, setResponse] = useState(p.response || "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  useEffect(() => { setStatus(p.status); setResponse(p.response || ""); }, [p.id, p.status, p.response]);
  useEffect(() => { feedbackEvents(p.id).then((e) => { setEvents(e); getNames(e.map((x) => x.actor)).then(setEvNames); }).catch((e) => { setEvents([]); setMsg(e.message); }); }, [p.id, p.updated_at]);
  const run = async (k, fn) => { setBusy(k); setMsg(""); try { await fn(); await onChanged(); setReason(""); setEvents(await feedbackEvents(p.id)); } catch (e) { setMsg(e.message); } setBusy(""); };
  const dupes = all.filter((x) => x.id !== p.id && x.entity?.toLowerCase() === p.entity?.toLowerCase() && x.city === p.city && Math.abs(new Date(x.created_at) - new Date(p.created_at)) < 30 * DAY);
  const copy = () => navigator.clipboard?.writeText(p.ref_no);
  return (
    <Drawer title={p.ref_no} onClose={onClose}>
      <div className="flex flex-wrap items-center gap-2"><StatusBadge s={p.status} /><PubBadge p={p.visibility === "private" ? "private" : p.publication} withdrawn={p.withdrawn} />{p.hidden && <span className="rounded-full bg-ruby/10 px-2.5 py-1 text-[11.5px] font-bold text-ruby">Hidden</span>}<button onClick={copy} className="focusable ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[12px] text-mute hover:bg-raised"><Copy size={13} />Copy ID</button></div>
      <h3 className="mt-3 font-display text-[22px] font-bold leading-tight">{p.title}</h3>
      <p className="mt-1 text-[13px] text-mute">{p.sector === "private" ? "Private sector" : "Government"} · {p.type === "review" ? "Review" : "Needs attention"} · {catById(p.cat).name}{p.sub ? ` · ${p.sub}` : ""} · {p.entity}{p.organization_id ? " (linked to directory)" : ""}{p.service_location ? ` · ${p.service_location}` : ""} · {place(p)}{p.experience_date ? ` · experienced ${fmt(p.experience_date)}` : ""}{p.further_reviews ? ` · further review requested ${p.further_reviews}x` : ""}</p>
      <p className="mt-4 whitespace-pre-wrap text-[14.5px] leading-relaxed">{p.body}</p>
      {p.suggestion && <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sun/10 p-3 text-[13.5px]"><Lightbulb size={16} className="mt-0.5 shrink-0" /><span><b>Suggested improvement:</b> {p.suggestion}</span></p>}
      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-raised p-4 text-[13px]">
        <div><dt className="text-faint">Submitted by</dt><dd className="font-semibold">{names[p.author_id] || "—"}{p.anon ? " (shown as anonymous)" : ""}</dd></div>
        <div><dt className="text-faint">Submitted</dt><dd className="font-semibold">{fmt(p.created_at)} · {ageDays(p)}d ago</dd></div>
        {p.rating && <div><dt className="text-faint">Rating</dt><dd className="font-semibold">{p.rating} / 5</dd></div>}
        {p.severity && <div><dt className="text-faint">Severity</dt><dd className="font-semibold">{p.severity}</dd></div>}
        <div><dt className="text-faint">Attachments</dt><dd className="font-semibold">{(p.evidence || []).length} (review in Moderation on the site)</dd></div>
        <div><dt className="text-faint">Assigned to</dt><dd className="font-semibold">{names[p.assigned_to] || "Nobody"}</dd></div>
      </dl>
      {dupes.length > 0 && <div className="mt-4 rounded-2xl bg-sun/15 p-3 text-[13px]"><p className="font-bold">Possible duplicates ({dupes.length})</p><p className="text-mute">{dupes.slice(0, 4).map((d) => d.ref_no).join(", ")} · same place and city within 30 days</p></div>}

      {canAct ? (
        <div className="mt-6 space-y-5">
          <section className="rounded-2xl border hair2 p-4">
            <p className="mb-2 text-[13px] font-bold">Public visibility</p>
            {p.visibility === "private" ? <p className="text-[13px] text-mute">Private feedback: visible only to the submitter and staff.</p> : (
              <div className="flex flex-wrap gap-2">
                <Btn tone="leaf" disabled={!!busy || p.publication === "approved"} onClick={() => run("pub", () => staffUpdate(p.id, { publication: "approved", reason }))}><Check size={15} />Approve for public</Btn>
                <Btn tone="ruby" disabled={!!busy || p.publication === "rejected"} onClick={() => run("pub", () => staffUpdate(p.id, { publication: "rejected", reason }))}><X size={15} />Do not publish</Btn>
                <Btn tone="soft" disabled={!!busy} onClick={() => run("hide", () => staffUpdate(p.id, { hidden: !p.hidden, reason }))}>{p.hidden ? <><Eye size={15} />Restore</> : <><EyeOff size={15} />Hide</>}</Btn>
              </div>
            )}
          </section>
          <section className="rounded-2xl border hair2 p-4">
            <p className="mb-2 text-[13px] font-bold">Feedback Progress and assignment</p>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="New status">{WORKFLOW.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</Select>
              <Btn disabled={!!busy || status === p.status} onClick={() => run("st", () => staffUpdate(p.id, { status, reason }))}>{busy === "st" ? <Loader2 size={15} className="animate-spin" /> : "Update progress"}</Btn>
              <Select value={p.assigned_to || ""} onChange={(e) => run("as", () => staffUpdate(p.id, e.target.value ? { assigned: e.target.value, status: p.status === "Submitted" || p.status === "Under review" ? "Assigned" : undefined, reason } : { unassign: true, reason }))} aria-label="Assign to">
                <option value="">Unassigned</option>{staff.map((s) => <option key={s.id} value={s.id}>{s.display_name || "Staff"} · {roleName(s.role)}</option>)}
              </Select>
              {p.assigned_to !== me.user.id && <Btn tone="soft" disabled={!!busy} onClick={() => run("as", () => staffUpdate(p.id, { assigned: me.user.id, status: ["Submitted", "Under review"].includes(p.status) ? "Assigned" : undefined, reason }))}><UserCheck size={15} />Assign to me</Btn>}
            </div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason or comment for this change (shown to the submitter in their timeline)" className="focusable mt-3 w-full rounded-2xl border hair2 bg-card p-3 text-[13.5px] outline-none" />
          </section>
          <section className="rounded-2xl border hair2 p-4">
            <p className="mb-2 text-[13px] font-bold">Response from One Youth One India (public)</p>
            <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3} placeholder="Shown to the submitter, and on the post if it is public" className="focusable w-full rounded-2xl border hair2 bg-card p-3 text-[13.5px] outline-none" />
            <Btn className="mt-2" disabled={!!busy || response.trim() === (p.response || "")} onClick={() => run("resp", () => staffUpdate(p.id, { response: response.trim() }))}><Send size={15} />Send response</Btn>
          </section>
          <section className="rounded-2xl border border-indigo/25 bg-indigo/5 p-4">
            <p className="mb-2 flex items-center gap-1.5 text-[13px] font-bold text-indigo"><StickyNote size={15} />Internal note (staff only)</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Never shown to the submitter" className="focusable w-full rounded-2xl border hair2 bg-card p-3 text-[13.5px] outline-none" />
            <Btn tone="indigo" className="mt-2" disabled={!!busy || !note.trim()} onClick={() => run("note", async () => { await addNote(p.id, me.user.id, note.trim()); setNote(""); })}>Add note</Btn>
          </section>
        </div>
      ) : <p className="mt-6 rounded-2xl bg-raised p-3 text-[13px] text-mute">Read only: your role can view records and reports but not change them.</p>}
      {msg && <p className="mt-4 rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
      <h4 className="mb-3 mt-7 font-display text-[16px] font-bold">Case history</h4>
      <Timeline events={events} names={evNames} />
    </Drawer>
  );
}

/* ---------------- Analytics ---------------- */
function Analytics({ rows, staff }) {
  const [range, setRange] = useState("90");
  const data = useMemo(() => (range === "all" ? rows : rows.filter((r) => Date.now() - new Date(r.created_at) <= Number(range) * DAY)), [rows, range]);
  const [resTimes, setResTimes] = useState(null);
  useEffect(() => {
    recentEvents().then((ev) => {
      const created = Object.fromEntries(rows.map((r) => [r.id, r.created_at]));
      const t = ev.filter((e) => e.kind === "status" && e.to_value === "Outcome provided" && created[e.post_id]).map((e) => (new Date(e.created_at) - new Date(created[e.post_id])) / DAY);
      setResTimes(t);
    }).catch(() => setResTimes([]));
  }, [rows]);
  const by = (fn) => { const m = {}; data.forEach((p) => { const k = fn(p); if (k) m[k] = (m[k] || 0) + 1; }); return Object.entries(m).sort((a, b) => b[1] - a[1]); };
  const open = data.filter(isOpen);
  const aging = [["0 to 2 days", 0, 2], ["3 to 7 days", 3, 7], ["8 to 15 days", 8, 15], ["Over 15 days", 16, 1e9]].map(([l, a, b]) => [l, open.filter((p) => ageDays(p) >= a && ageDays(p) <= b).length, b > 15 ? "#E5484D" : "#3B3FD8"]);
  const resolved = data.filter((p) => ["Outcome provided", "Closed"].includes(p.status)).length;
  const avg = resTimes?.length ? (resTimes.reduce((s, v) => s + v, 0) / resTimes.length).toFixed(1) : "—";
  const staffName = Object.fromEntries(staff.map((s) => [s.id, s.display_name || "Staff"]));
  const exportCsv = () => toCsv(by((p) => `${p.state}|${p.district || ""}|${catById(p.cat).name}|${STATUS_LABEL[p.status]}`).map(([k, n]) => [...k.split("|"), n]), [["State", (r) => r[0]], ["District", (r) => r[1]], ["Category", (r) => r[2]], ["Status", (r) => r[3]], ["Count", (r) => r[4]]]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={range} onChange={(e) => setRange(e.target.value)} aria-label="Date range"><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option><option value="all">All time</option></Select>
        <Btn tone="soft" onClick={exportCsv}><Download size={15} />Export summary CSV</Btn>
        <span className="text-[12.5px] text-faint">All figures are calculated live from database records within your access scope.</span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Submissions" value={data.length} icon={Inbox} />
        <Kpi label="Resolution rate" value={`${data.length ? Math.round((resolved / data.length) * 100) : 0}%`} icon={CheckCircle2} color="#13A86B" />
        <Kpi label="Avg days to resolve" value={avg} icon={Clock} color="#3B3FD8" hint={resTimes ? `${resTimes.length} cases` : ""} />
        <Kpi label="Open cases" value={open.length} icon={ShieldAlert} color="#FF7A2F" />
      </div>
      <Card title="Submissions per day"><Trend items={data.map((r) => r.created_at)} days={range === "7" ? 7 : 30} /></Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="By category"><Bars rows={by((p) => catById(p.cat).name).slice(0, 10).map(([k, n]) => [k, n, CATEGORIES.find((c) => c.name === k)?.color])} /></Card>
        <Card title="By state"><Bars rows={by((p) => p.state).slice(0, 10)} color="#13A86B" /></Card>
        <Card title="Top districts"><Bars rows={by((p) => (p.district ? `${p.district}, ${p.state}` : null)).slice(0, 10)} color="#FF7A2F" /></Card>
        <Card title="Open case aging"><Bars rows={aging} /></Card>
        <Card title="Workload by assignee"><Bars rows={by((p) => (isOpen(p) && p.assigned_to ? staffName[p.assigned_to] || "Staff" : null))} color="#7C3AED" empty="No open cases are assigned yet." /></Card>
        <Card title="Reviews: average rating by category"><Bars rows={Object.entries(data.filter((p) => p.rating).reduce((m, p) => { const k = catById(p.cat).name; (m[k] = m[k] || []).push(p.rating); return m; }, {})).map(([k, v]) => [k, +(v.reduce((s, x) => s + x, 0) / v.length).toFixed(1)]).sort((a, b) => b[1] - a[1]).slice(0, 10)} color="#F5B400" empty="No rated reviews yet." /></Card>
      </div>
    </div>
  );
}

/* ---------------- Users & roles ---------------- */
function UsersTab({ me }) {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState("");
  const load = () => listUsers().then(setUsers).catch((e) => { setMsg(e.message); setUsers([]); });
  useEffect(() => { load(); }, []);
  const list = (users || []).filter((u) => !q || `${u.email} ${u.phone} ${u.display_name} ${u.role}`.toLowerCase().includes(q.toLowerCase()));
  const save = async () => { setMsg(""); try { await setRole(edit.id, edit.role, edit.scope_state, edit.scope_district, edit.active); setEdit(null); load(); } catch (e) { setMsg(e.message); } };
  const counts = ROLES.map(([r, l]) => [l, (users || []).filter((u) => (u.role || "citizen") === r).length]).filter((x) => x[1]);
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card title="Users" className="xl:col-span-2" action={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search users" aria-label="Search users" />}>
        {msg && <p className="mb-3 rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
        {users === null ? <p className="flex items-center gap-2 text-mute"><Loader2 size={16} className="animate-spin" />Loading users</p> : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead><tr className="border-b hair2 text-[11.5px] uppercase tracking-wide text-faint">{["User", "Role", "Scope", "Status", "Joined", "Last sign in", ""].map((h) => <th key={h} className="py-2.5 pr-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{list.map((u) => (
                <tr key={u.id} className="border-b hair">
                  <td className="py-3 pr-3"><p className="font-semibold">{u.display_name || "—"}</p><p className="text-[12px] text-mute">{u.email || u.phone}</p></td>
                  <td className="py-3 pr-3">{roleName(u.role || "citizen")}</td>
                  <td className="py-3 pr-3 text-mute">{[u.scope_district, u.scope_state].filter(Boolean).join(", ") || "—"}</td>
                  <td className="py-3 pr-3">{u.active === false ? <span className="text-ruby">Deactivated</span> : "Active"}</td>
                  <td className="whitespace-nowrap py-3 pr-3 text-mute">{fmt(u.created_at)}</td>
                  <td className="whitespace-nowrap py-3 pr-3 text-mute">{fmt(u.last_sign_in_at)}</td>
                  <td className="py-3"><Btn tone="soft" className="h-8 px-3 text-[12.5px]" onClick={() => setEdit({ ...u, role: u.role || "citizen", active: u.active !== false })}>Edit</Btn></td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </Card>
      <Card title="Roles in use"><Bars rows={counts} color="#3B3FD8" /><p className="mt-4 text-[12.5px] text-faint">Every role change is written to the audit log. State and District Administrators only see feedback in their assigned area.</p></Card>
      {edit && (
        <Drawer title={`Edit access: ${edit.display_name || edit.email || "user"}`} onClose={() => setEdit(null)} footer={<div className="flex gap-2"><Btn onClick={save}>Save changes</Btn><Btn tone="soft" onClick={() => setEdit(null)}>Cancel</Btn></div>}>
          <label className="block text-[13px] font-semibold">Role
            <Select value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })} className="mt-1.5 w-full">{ROLES.filter(([r]) => r !== "super_admin" || me.role === "super_admin").map(([r, l]) => <option key={r} value={r}>{l}</option>)}</Select></label>
          {["state_admin", "district_admin"].includes(edit.role) && (
            <label className="mt-4 block text-[13px] font-semibold">State
              <Select value={edit.scope_state || ""} onChange={(e) => setEdit({ ...edit, scope_state: e.target.value, scope_district: "" })} className="mt-1.5 w-full"><option value="">Choose a state</option>{STATES.map((s) => <option key={s}>{s}</option>)}</Select></label>
          )}
          {edit.role === "district_admin" && edit.scope_state && (
            <label className="mt-4 block text-[13px] font-semibold">District
              <Select value={edit.scope_district || ""} onChange={(e) => setEdit({ ...edit, scope_district: e.target.value })} className="mt-1.5 w-full"><option value="">Choose a district</option>{districtsOf(edit.scope_state).map((d) => <option key={d}>{d}</option>)}</Select></label>
          )}
          <label className="mt-5 flex items-center gap-2 text-[13.5px] font-semibold"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} />Account active (untick to revoke all staff access)</label>
          {msg && <p className="mt-4 rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
        </Drawer>
      )}
    </div>
  );
}

/* ---------------- Audit ---------------- */
function AuditTab() {
  const [log, setLog] = useState(null);
  const [ev, setEv] = useState(null);
  const [nm, setNm] = useState({});
  useEffect(() => {
    Promise.all([auditLog(), recentEvents()]).then(async ([a, e]) => { setLog(a); setEv(e); setNm(await getNames([...a.map((x) => x.actor), ...e.map((x) => x.actor), ...a.map((x) => x.target)])); }).catch(() => { setLog([]); setEv([]); });
  }, []);
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title="Role and access changes">
        {!log ? <Loader2 size={16} className="animate-spin" /> : !log.length ? <p className="text-[13px] text-mute">No changes recorded yet.</p> : (
          <ul className="divide-y hair text-[13px]">{log.map((l) => <li key={l.id} className="py-2.5"><p><b>{nm[l.actor] || "Admin"}</b> changed <b>{nm[l.target] || "a user"}</b> from {roleName(l.detail?.from || "citizen")} to {roleName(l.detail?.to)}{l.detail?.state ? ` (${[l.detail.district, l.detail.state].filter(Boolean).join(", ")})` : ""}{l.detail?.active === false ? ", deactivated" : ""}</p><p className="text-[11.5px] text-faint">{fmt(l.created_at)}</p></li>)}</ul>
        )}
      </Card>
      <Card title="Recent feedback activity">
        {!ev ? <Loader2 size={16} className="animate-spin" /> : !ev.length ? <p className="text-[13px] text-mute">No activity yet.</p> : (
          <ul className="divide-y hair text-[13px]">{ev.slice(0, 100).map((e) => <li key={e.id} className="py-2.5"><p><b>{nm[e.actor] || "System"}</b> · {e.kind}{e.to_value && e.kind !== "response" ? `: ${STATUS_LABEL[e.to_value] || PUB_LABEL[e.to_value] || e.to_value}` : ""}{e.reason ? ` · ${e.reason}` : ""}</p><p className="text-[11.5px] text-faint">{fmt(e.created_at)}</p></li>)}</ul>
        )}
      </Card>
      <p className="text-[12px] text-faint xl:col-span-2">Audit records are append only: the database has no policy that allows anyone, including administrators, to edit or delete them through the app.</p>
    </div>
  );
}
