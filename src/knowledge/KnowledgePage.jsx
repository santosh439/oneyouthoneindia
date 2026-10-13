import { useEffect, useMemo, useState } from "react";
import { Scale, BookOpen, FileText, Landmark, MessageCircleQuestion, ExternalLink, Search, Copy, Check, Plus, Trash2, Loader2, Info, CalendarClock, AlertTriangle, CheckCircle2, ShieldCheck, Send, ChevronDown, LogIn } from "lucide-react";
import { Shell, Card, Empty, Btn, Input, Select, Drawer } from "../portal/ui.jsx";
import { session } from "../portal/api.js";
import { sb, hasSupabase } from "../sb.js";
import { loadCms } from "../cms.js";
import { STATES, districtsOf } from "../data.js";
import { OFFICIAL, LIBRARY, LIBRARY_MORE, PREAMBLE, PARTS, PARTS_NOTE, SCHEDULES, AMENDMENTS, DPSP_NOTE } from "./constitution.js";
import { RTI_SOURCES, RTI_FEES, RTI_TIMELINE, RTI_STEPS, rtiDeadlines, draftRti } from "./rti.js";
import { LEVELS, KINDS, utInfo, GOV_SOURCES, GOV_NOTE } from "./government.js";
import { buildDocs, makeIndex, answer, DISCLAIMER } from "./index.js";

const TABS = [["rights", "Know your rights", Scale], ["library", "Constitution library", BookOpen], ["rti", "RTI assistant", FileText], ["government", "Government explorer", Landmark], ["ask", "Ask Your Constitution", MessageCircleQuestion]];
const Src = ({ s }) => s ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] font-semibold text-indigo hover:underline"><ExternalLink size={12} />{s.label}</a> : null;
const Reviewed = ({ d }) => d.reviewed ? <span className="inline-flex items-center gap-1 rounded-full bg-leaf/10 px-2 py-0.5 text-[11px] font-bold text-leaf"><ShieldCheck size={12} />Reviewed{typeof d.reviewed === "string" ? ` ${d.reviewed}` : ""}</span> : <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-semibold text-mute">Plain language summary</span>;

export default function KnowledgePage() {
  const [tab, setTab] = useState(() => (TABS.find(([k]) => location.hash === `#${k}`) || TABS[0])[0]);
  const [docs, setDocs] = useState(() => buildDocs());
  const [me, setMe] = useState(null);
  useEffect(() => { loadCms().then(() => setDocs(buildDocs())); session().then(setMe).catch(() => setMe({ user: null })); }, []);
  const go = (t) => { setTab(t); history.replaceState(null, "", `${location.pathname}${location.search}#${t}`); window.scrollTo({ top: 0, behavior: "smooth" }); };
  return (
    <Shell title="Know your rights" subtitle={undefined}>
      <div className="mb-6">
        <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-saffron">Citizen Knowledge Center</p>
        <h1 className="mt-1 font-display text-[32px] font-extrabold leading-tight tracking-[-0.03em] md:text-[42px]">Know your rights, use them well</h1>
        <p className="mt-2 max-w-3xl text-[15px] text-mute">Your rights under the Constitution, how to use the Right to Information Act, and who does what in government, explained simply with links to the official sources.</p>
      </div>
      <div role="tablist" aria-label="Knowledge Center" className="no-scrollbar -mx-4 mb-6 flex gap-1.5 overflow-x-auto px-4">
        {TABS.map(([k, l, I]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => go(k)} className={`focusable inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold ${tab === k ? "bg-ink text-bg" : "bg-raised text-mute hover:text-ink"}`}><I size={16} />{l}</button>)}
      </div>
      <div role="tabpanel">
        {tab === "rights" && <Rights docs={docs} go={go} />}
        {tab === "library" && <Library docs={docs} />}
        {tab === "rti" && <Rti me={me} />}
        {tab === "government" && <Government />}
        {tab === "ask" && <Ask docs={docs} />}
      </div>
      <p className="mt-10 flex items-start gap-2 rounded-2xl bg-raised p-4 text-[12.5px] text-mute"><Info size={15} className="mt-0.5 shrink-0" />{DISCLAIMER}</p>
    </Shell>
  );
}

/* ---------------- Know your rights ---------------- */
function Rights({ docs, go }) {
  const [group, setGroup] = useState("all");
  const [open, setOpen] = useState(null);
  const rights = docs.filter((d) => d.type === "Fundamental Right" || (d.type === "Constitution" && d.id.startsWith("art-")));
  const groups = [...new Set(rights.map((d) => d.tags.replace(" fundamental rights", "")))];
  const list = rights.filter((d) => group === "all" || d.tags.startsWith(group));
  const duties = docs.filter((d) => d.type === "Fundamental Duty"), dpsp = docs.filter((d) => d.type === "Directive Principle");
  const COLORS = ["#FF7A2F", "#3B3FD8", "#13A86B", "#7C3AED", "#E5484D", "#0E7490", "#B45309"];
  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {[["Fundamental Rights", "Part III, Articles 12 to 35", "Enforceable in court. If violated you can go to the High Court (Article 226) or Supreme Court (Article 32).", "#3B3FD8"], ["Fundamental Duties", "Part IVA, Article 51A", "Eleven duties every citizen should follow. Not enforced by courts, but guide good citizenship.", "#13A86B"], ["Directive Principles", "Part IV, Articles 36 to 51", "Goals the government must keep in mind when making laws and policy.", "#FF7A2F"]].map(([t, s, x, c]) => (
          <div key={t} className="rounded-3xl border hair bg-card p-5"><p className="font-display text-[19px] font-bold" style={{ color: c }}>{t}</p><p className="text-[12.5px] font-semibold text-faint">{s}</p><p className="mt-2 text-[13.5px] text-mute">{x}</p></div>
        ))}
      </div>
      <div>
        <div className="mb-4 flex flex-wrap gap-1.5">{["all", ...groups].map((g) => <button key={g} onClick={() => setGroup(g)} className={`focusable rounded-full px-3.5 py-2 text-[13px] font-semibold ${group === g ? "bg-indigo text-white" : "bg-raised text-mute hover:text-ink"}`}>{g === "all" ? "All rights" : g}</button>)}</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {list.map((d, i) => (
            <button key={d.id} onClick={() => setOpen(d)} className="focusable group rounded-3xl border hair bg-card p-5 text-left transition hover:-translate-y-0.5">
              <div className="flex items-center gap-2"><span className="rounded-full px-2.5 py-1 text-[11.5px] font-bold text-white" style={{ background: COLORS[groups.indexOf(d.tags.replace(" fundamental rights", "")) % COLORS.length] || "#6B7280" }}>{d.ref}</span><Reviewed d={d} /></div>
              <h3 className="mt-3 font-display text-[18px] font-bold leading-snug">{d.title}</h3>
              <p className="mt-1.5 line-clamp-3 text-[13.5px] text-mute">{d.text}</p>
              <p className="mt-3 text-[12.5px] font-semibold text-indigo">Read more and example</p>
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Fundamental Duties (Article 51A)"><ol className="space-y-2.5 text-[13.5px]">{duties.map((d) => <li key={d.id} className="flex gap-3"><span className="font-mono text-[12px] font-bold text-leaf">{d.ref.replace("Article 51A", "")}</span><span>{d.text}</span></li>)}</ol><div className="mt-3"><Src s={OFFICIAL.constitution} /></div></Card>
        <Card title="Directive Principles of State Policy"><p className="-mt-2 mb-3 text-[12.5px] text-mute">{DPSP_NOTE}</p><ul className="space-y-2.5 text-[13.5px]">{dpsp.map((d) => <li key={d.id}><b>{d.ref}:</b> {d.text}</li>)}</ul><div className="mt-3"><Src s={OFFICIAL.constitution} /></div></Card>
      </div>
      <Card title="If your rights are violated">
        <ol className="grid gap-3 text-[13.5px] md:grid-cols-4">
          {[["Write it down", "Note dates, places, names of officers and keep copies of documents."], ["Use the grievance channel", "Complain to the department, or use CPGRAMS for Central matters. Share it on One Youth One India to build support."], ["Ask for records with RTI", "Use the RTI assistant to get file notings and decisions."], ["Get free legal aid", "Contact your District Legal Services Authority; courts can be approached under Articles 226 and 32."]].map(([t, x], i) => <li key={t} className="rounded-2xl bg-raised p-4"><span className="font-display text-[22px] font-extrabold text-indigo/40">{i + 1}</span><p className="font-bold">{t}</p><p className="mt-1 text-mute">{x}</p></li>)}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2"><Btn tone="soft" onClick={() => go("rti")}>Open the RTI assistant</Btn><Btn tone="soft" onClick={() => go("ask")}>Ask a question</Btn></div>
      </Card>
      {open && <Drawer title={`${open.ref}: ${open.title}`} onClose={() => setOpen(null)}>
        <div className="flex flex-wrap gap-2"><span className="rounded-full bg-indigo/10 px-2.5 py-1 text-[12px] font-bold text-indigo">{open.tags.replace(" fundamental rights", "")}</span><Reviewed d={open} /></div>
        <p className="mt-4 text-[15px] leading-relaxed">{open.text}</p>
        {open.example && <div className="mt-5 rounded-2xl border border-saffron/30 bg-saffron/5 p-4"><p className="text-[12px] font-bold uppercase tracking-wide text-saffron">In daily life</p><p className="mt-1 text-[14px]">{open.example}</p></div>}
        <p className="mt-5 text-[13px] text-mute">Applies to: {open.jurisdiction}</p>
        <div className="mt-3"><Src s={open.source} /></div>
        <p className="mt-6 rounded-xl bg-raised p-3 text-[12.5px] text-mute">This is a summary in simple words. The exact wording, exceptions and court interpretations are in the official text.</p>
      </Drawer>}
    </div>
  );
}

/* ---------------- Constitution library ---------------- */
function Library({ docs }) {
  const [q, setQ] = useState("");
  const search = useMemo(() => makeIndex(docs.filter((d) => !d.id.startsWith("rti") && !d.id.startsWith("gov"))), [docs]);
  const hits = q.trim().length > 1 ? search(q, 8) : [];
  return (
    <div className="space-y-6">
      <Card title="Official Constitution of India (PDF)">
        <p className="-mt-2 mb-4 text-[13.5px] text-mute">Each button opens the official PDF directly from the Legislative Department, Ministry of Law and Justice. Files are large (2 to 40 MB), so allow a few seconds on mobile data.</p>
        <ul className="grid gap-3 md:grid-cols-2">{LIBRARY.map(([t, x, ed, u]) => (
          <li key={t}><a href={u} target="_blank" rel="noopener noreferrer" className="focusable group flex h-full items-start gap-3 rounded-2xl border hair2 p-4 hover:bg-raised">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ruby/10 text-[10px] font-extrabold text-ruby">PDF</span>
            <span className="min-w-0 flex-1"><span className="block text-[15px] font-bold">{t}</span><span className="block text-[12.5px] text-mute">{x}</span><span className="mt-1 block text-[11.5px] font-semibold text-leaf">{ed}</span></span>
            <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo px-3 py-1.5 text-[12px] font-bold text-white group-hover:opacity-90">Open<ExternalLink size={12} /></span>
          </a></li>))}</ul>
        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-mute"><Info size={14} className="shrink-0" />Other languages: <a href={LIBRARY_MORE.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo hover:underline">{LIBRARY_MORE.label}</a>. {LIBRARY_MORE.note}</p>
      </Card>
      <Card title="Search the Constitution">
        <div className="relative"><Search size={16} className="absolute left-3.5 top-3 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try: Article 19, panchayat, emergency, Eighth Schedule, GST" className="w-full pl-10" aria-label="Search the Constitution" /></div>
        {q.trim().length > 1 && <ul className="mt-4 divide-y hair">{hits.map(({ doc: d }) => <li key={d.id} className="py-3"><p className="text-[12px] font-bold uppercase tracking-wide text-faint">{d.type} · {d.ref}</p><p className="text-[14.5px] font-semibold">{d.title}</p><p className="text-[13.5px] text-mute">{d.text}</p></li>)}{!hits.length && <li className="py-3 text-[13.5px] text-mute">No matches. Try other words or search inside the official PDF.</li>}</ul>}
      </Card>
      <Card title="Preamble"><p className="font-display text-[16px] leading-relaxed">{PREAMBLE}</p><div className="mt-3"><Src s={OFFICIAL.constitution} /></div></Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={`Parts (${PARTS.length})`}><ul className="divide-y hair text-[13.5px]">{PARTS.map(([n, t, a]) => <li key={n} className="flex gap-3 py-2"><span className="w-12 font-mono font-bold text-indigo">{n}</span><span className="flex-1">{t}</span><span className="text-faint">Art. {a}</span></li>)}</ul><p className="mt-3 text-[12px] text-faint">{PARTS_NOTE}</p></Card>
        <div className="space-y-5">
          <Card title="Schedules (12)"><ul className="space-y-2 text-[13.5px]">{SCHEDULES.map(([n, t]) => <li key={n}><b>{n}:</b> {t}</li>)}</ul></Card>
          <Card title="Key amendments"><ul className="space-y-2 text-[13.5px]">{AMENDMENTS.map(([n, y, t]) => <li key={n} className="flex gap-3"><span className="w-20 shrink-0 font-bold text-saffron">{n} ({y})</span><span>{t}</span></li>)}</ul><div className="mt-3"><Src s={OFFICIAL.constitution} /></div></Card>
        </div>
      </div>
    </div>
  );
}

/* ---------------- RTI assistant ---------------- */
const blankDraft = { level: "central", state: "", authority: "", address: "", subject: "", period: "", questions: ["", ""], mode: "copies", bpl: false, lifeLiberty: false, name: "", applicantAddress: "", phone: "", email: "", place: "" };
function Rti({ me }) {
  const [view, setView] = useState("guide");
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5">{[["guide", "Guide and time limits"], ["draft", "Draft an application"], ["track", "My RTI tracker"]].map(([k, l]) => <button key={k} onClick={() => setView(k)} className={`focusable rounded-full px-4 py-2 text-[13.5px] font-semibold ${view === k ? "bg-indigo text-white" : "bg-raised text-mute hover:text-ink"}`}>{l}</button>)}</div>
      {view === "guide" && <RtiGuide />}
      {view === "draft" && <RtiDraft me={me} onSaved={() => setView("track")} />}
      {view === "track" && <RtiTracker me={me} />}
    </div>
  );
}
function RtiGuide() {
  return (
    <div className="space-y-5">
      <Card title="How to file an RTI in five steps"><ol className="grid gap-3 md:grid-cols-5">{RTI_STEPS.map(([t, x], i) => <li key={t} className="rounded-2xl bg-raised p-4"><span className="font-display text-[24px] font-extrabold text-saffron/60">{i + 1}</span><p className="text-[14px] font-bold">{t}</p><p className="mt-1 text-[12.5px] text-mute">{x}</p></li>)}</ol>
        <div className="mt-4 flex flex-wrap gap-3">{Object.values(RTI_SOURCES).map((s) => <Src key={s.url} s={s} />)}</div></Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Time limits"><table className="w-full text-[13.5px]"><tbody>{RTI_TIMELINE.map(([t, v, x]) => <tr key={t} className="border-b hair align-top"><td className="py-2.5 pr-3 font-semibold">{t}</td><td className="whitespace-nowrap py-2.5 pr-3 font-bold text-indigo">{v}</td><td className="py-2.5 text-mute">{x}</td></tr>)}</tbody></table></Card>
        <Card title="Fees"><table className="w-full text-[13.5px]"><tbody>{RTI_FEES.map(([t, v]) => <tr key={t} className="border-b hair align-top"><td className="py-2.5 pr-3">{t}</td><td className="py-2.5 font-semibold">{v}</td></tr>)}</tbody></table><p className="mt-3 text-[12px] text-faint">State public authorities follow their State's RTI rules for fees and forms.</p></Card>
      </div>
      <Card title="Key sections of the RTI Act, 2005"><SectionList /></Card>
    </div>
  );
}
function SectionList() {
  const docs = buildDocs().filter((d) => d.type === "RTI Act, 2005"); const [open, setOpen] = useState(null);
  return <ul className="divide-y hair">{docs.map((d) => <li key={d.id}><button onClick={() => setOpen(open === d.id ? null : d.id)} aria-expanded={open === d.id} className="focusable flex w-full items-center gap-3 py-3 text-left"><span className="w-28 shrink-0 font-mono text-[12.5px] font-bold text-indigo">{d.ref}</span><span className="flex-1 text-[14px] font-semibold">{d.title}</span><ChevronDown size={16} className={`text-faint transition ${open === d.id ? "rotate-180" : ""}`} /></button>{open === d.id && <div className="pb-4 pl-[124px] text-[13.5px] text-mute">{d.text}<div className="mt-2"><Src s={d.source} /></div></div>}</li>)}</ul>;
}
function RtiDraft({ me, onSaved }) {
  const [f, setF] = useState(blankDraft);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const text = draftRti(f);
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setMsg("Select the text and copy it manually."); } };
  const save = async () => {
    if (!me?.user) return setMsg("Sign in to save drafts and track deadlines.");
    if (!f.subject && !f.authority) return setMsg("Add the public authority or subject first.");
    const { error } = await sb().from("rti_requests").insert({ user_id: me.user.id, title: (f.subject || `RTI to ${f.authority}`).slice(0, 200), authority: f.authority || null, level: f.level, state: f.state || null, status: "draft", draft: text });
    if (error) setMsg(error.message); else onSaved();
  };
  const lbl = "block text-[13px] font-semibold"; const inp = "focusable mt-1.5 w-full rounded-2xl border hair2 bg-card p-3 text-[13.5px] outline-none";
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Your request">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>Public authority level<Select value={f.level} onChange={(e) => set("level", e.target.value)} className="mt-1.5 w-full"><option value="central">Central Government</option><option value="state">State Government or local body</option></Select></label>
            {f.level === "state" && <label className={lbl}>State or UT<Select value={f.state} onChange={(e) => set("state", e.target.value)} className="mt-1.5 w-full"><option value="">Choose</option>{STATES.map((s) => <option key={s}>{s}</option>)}</Select></label>}
          </div>
          <label className={lbl}>Public authority (department or office)<input className={inp} value={f.authority} onChange={(e) => set("authority", e.target.value)} placeholder="e.g. Office of the Executive Engineer, Public Works Department" maxLength={200} /></label>
          <label className={lbl}>Its address<textarea rows={2} className={inp} value={f.address} onChange={(e) => set("address", e.target.value)} /></label>
          <label className={lbl}>Subject<input className={inp} value={f.subject} onChange={(e) => set("subject", e.target.value)} placeholder="e.g. repair of the road outside the metro station" maxLength={200} /></label>
          <label className={lbl}>Period (optional)<input className={inp} value={f.period} onChange={(e) => set("period", e.target.value)} placeholder="e.g. 1 April 2025 to 31 March 2026" /></label>
          <div><p className="text-[13px] font-semibold">Information requested</p><p className="text-[12px] text-mute">Ask for specific documents and facts, not opinions or reasons.</p>
            {f.questions.map((q, i) => <div key={i} className="mt-2 flex gap-2"><span className="mt-3 w-5 text-[13px] text-faint">{i + 1}.</span><textarea rows={2} className={`${inp} mt-0 flex-1`} value={q} onChange={(e) => set("questions", f.questions.map((x, j) => (j === i ? e.target.value : x)))} placeholder={i === 0 ? "e.g. Certified copy of the work order and estimate for the road repair" : "e.g. Daily progress report and names of officers who inspected the work"} />{f.questions.length > 1 && <button onClick={() => set("questions", f.questions.filter((_, j) => j !== i))} className="focusable mt-2 rounded-full p-2 text-mute hover:bg-raised" aria-label="Remove question"><Trash2 size={15} /></button>}</div>)}
            <Btn tone="soft" className="mt-2" onClick={() => set("questions", [...f.questions, ""])}><Plus size={15} />Add question</Btn></div>
          <label className={lbl}>How you want it<Select value={f.mode} onChange={(e) => set("mode", e.target.value)} className="mt-1.5 w-full"><option value="copies">Certified copies</option><option value="email">By email (electronic)</option><option value="inspection">Inspect records first</option></Select></label>
          <label className="flex items-center gap-2 text-[13.5px] font-semibold"><input type="checkbox" checked={f.bpl} onChange={(e) => set("bpl", e.target.checked)} />I am below the poverty line (no fee)</label>
          <label className="flex items-center gap-2 text-[13.5px] font-semibold"><input type="checkbox" checked={f.lifeLiberty} onChange={(e) => set("lifeLiberty", e.target.checked)} />This concerns someone's life or liberty (48 hours)</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={lbl}>Your name<input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
            <label className={lbl}>Place<input className={inp} value={f.place} onChange={(e) => set("place", e.target.value)} /></label>
          </div>
          <label className={lbl}>Your address<textarea rows={2} className={inp} value={f.applicantAddress} onChange={(e) => set("applicantAddress", e.target.value)} /></label>
          <p className="flex items-start gap-2 text-[12px] text-faint"><Info size={14} className="mt-0.5 shrink-0" />Your name and address are only used to build the text on this screen. They are saved only if you choose Save to my tracker, and only you can see your tracker.</p>
        </div>
      </Card>
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card title="Your application" action={<div className="flex gap-2"><Btn tone="soft" onClick={copy}>{copied ? <><Check size={15} />Copied</> : <><Copy size={15} />Copy</>}</Btn><Btn onClick={save}><Plus size={15} />Save to my tracker</Btn></div>}>
          <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-2xl bg-raised p-4 font-sans text-[13px] leading-relaxed">{text}</pre>
          {msg && <p className="mt-3 rounded-xl bg-indigo/10 p-3 text-[13px] text-indigo">{msg}</p>}
          <p className="mt-3 text-[12.5px] text-mute">{f.level === "central" ? <>For Central ministries and departments, submit online at <Src s={RTI_SOURCES.portal} />.</> : "Submit to the PIO of the State department by post or through your State's RTI portal, if it has one."}</p>
        </Card>
      </div>
    </div>
  );
}
const blankReq = { title: "", authority: "", level: "central", state: "", reg_no: "", filed_on: "", via_apio: false, life_liberty: false, third_party: false, reply_on: "", fa_filed_on: "", fa_order_on: "", sa_filed_on: "", status: "open", notes: "" };
function RtiTracker({ me }) {
  const [rows, setRows] = useState(null);
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState("");
  const load = () => sb().from("rti_requests").select("*").order("created_at", { ascending: false }).then(({ data, error }) => { if (error) setMsg(error.message); setRows(data || []); });
  useEffect(() => { if (me?.user && hasSupabase()) load(); }, [me?.user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!me) return <p className="flex items-center gap-2 text-mute"><Loader2 size={16} className="animate-spin" />Loading</p>;
  if (!me.user) return <Card><p className="text-[14.5px]">Sign in to keep a private list of your RTI applications with automatic deadline reminders.</p><a href="/?signin=1" className="focusable mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-indigo px-5 text-[14px] font-bold text-white"><LogIn size={17} />Sign in</a></Card>;
  const save = async () => {
    const r = Object.fromEntries(Object.entries(edit).map(([k, v]) => [k, v === "" ? null : v]));
    if (!r.title || r.title.length < 3) return setMsg("Add a short title.");
    const payload = { title: r.title, authority: r.authority, level: r.level, state: r.state, reg_no: r.reg_no, filed_on: r.filed_on, via_apio: !!r.via_apio, life_liberty: !!r.life_liberty, third_party: !!r.third_party, reply_on: r.reply_on, fa_filed_on: r.fa_filed_on, fa_order_on: r.fa_order_on, sa_filed_on: r.sa_filed_on, status: r.filed_on && r.status === "draft" ? "open" : r.status, notes: r.notes };
    const q = edit.id ? sb().from("rti_requests").update(payload).eq("id", edit.id) : sb().from("rti_requests").insert({ ...payload, user_id: me.user.id });
    const { error } = await q; if (error) return setMsg(/check/i.test(error.message) ? "Dates are out of order: a reply or appeal cannot be before the filing date." : error.message);
    setEdit(null); setMsg(""); load();
  };
  const del = async (id) => { if (!confirm("Delete this RTI record?")) return; await sb().from("rti_requests").delete().eq("id", id); setEdit(null); load(); };
  const tone = { overdue: "#E5484D", second_appeal_window: "#B45309", reply_received: "#3B3FD8", awaiting_reply: "#13A86B", first_appeal: "#7C3AED", draft: "#6B7280", closed: "#6B7280", second_appeal: "#0E7490" };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3"><p className="flex-1 text-[13.5px] text-mute">Private to you. Deadlines are calculated from the RTI Act; check them against the dates on your receipts.</p><Btn onClick={() => setEdit({ ...blankReq })}><Plus size={15} />Add an RTI</Btn></div>
      {msg && !edit && <p className="rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
      {rows === null ? <Loader2 size={16} className="animate-spin" /> : !rows.length ? <Empty icon={FileText} text="No RTI applications yet. Draft one, or add one you have already filed." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => { const dl = rtiDeadlines(r); const c = tone[dl.next.stage]; return (
            <button key={r.id} onClick={() => setEdit({ ...blankReq, ...Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v ?? ""])) })} className="focusable rounded-3xl border hair bg-card p-5 text-left hover:-translate-y-0.5">
              <div className="flex items-start gap-3"><span className="min-w-0 flex-1"><span className="block truncate font-display text-[17px] font-bold">{r.title}</span><span className="block truncate text-[12.5px] text-mute">{r.authority || "Authority not set"}{r.reg_no ? ` · ${r.reg_no}` : ""}</span></span>
                {dl.daysLeft != null && <span className="shrink-0 text-right"><span className="tab block font-display text-[22px] font-extrabold" style={{ color: c }}>{dl.daysLeft < 0 ? `${-dl.daysLeft}d` : `${dl.daysLeft}d`}</span><span className="text-[11px] text-faint">{dl.daysLeft < 0 ? "overdue" : "left"}</span></span>}</div>
              <p className="mt-3 flex items-center gap-2 text-[13px] font-semibold" style={{ color: c }}>{dl.next.stage === "overdue" ? <AlertTriangle size={15} /> : dl.next.stage === "closed" ? <CheckCircle2 size={15} /> : <CalendarClock size={15} />}{dl.next.text}{dl.next.due ? ` by ${new Date(dl.next.due).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>
            </button>); })}
        </div>
      )}
      {edit && (
        <Drawer title={edit.id ? "Update RTI" : "Add an RTI"} onClose={() => { setEdit(null); setMsg(""); }} footer={<div className="flex flex-wrap gap-2"><Btn onClick={save}><Send size={15} />Save</Btn>{edit.id && <Btn tone="soft" onClick={() => del(edit.id)}><Trash2 size={15} />Delete</Btn>}</div>}>
          <div className="space-y-4 text-[13px]">
            {[["title", "Title", "text"], ["authority", "Public authority", "text"], ["reg_no", "Registration or reference number", "text"]].map(([k, l]) => <label key={k} className="block font-semibold">{l}<Input value={edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} className="mt-1.5 w-full rounded-2xl" /></label>)}
            <div className="grid grid-cols-2 gap-3">
              {[["filed_on", "Filed on"], ["reply_on", "Reply received on"], ["fa_filed_on", "First appeal filed on"], ["fa_order_on", "First appeal order on"], ["sa_filed_on", "Second appeal filed on"]].map(([k, l]) => <label key={k} className="block font-semibold">{l}<Input type="date" value={edit[k] || ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} className="mt-1.5 w-full rounded-2xl" /></label>)}
              <label className="block font-semibold">Status<Select value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })} className="mt-1.5 w-full"><option value="draft">Draft</option><option value="open">Open</option><option value="closed">Closed</option></Select></label>
            </div>
            {[["via_apio", "Submitted to an Assistant PIO (+5 days)"], ["life_liberty", "Concerns life or liberty (48 hours)"], ["third_party", "Third party information involved (40 days)"]].map(([k, l]) => <label key={k} className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={!!edit[k]} onChange={(e) => setEdit({ ...edit, [k]: e.target.checked })} />{l}</label>)}
            <label className="block font-semibold">Notes<textarea rows={3} value={edit.notes || ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} className="focusable mt-1.5 w-full rounded-2xl border hair2 bg-card p-3 outline-none" /></label>
            {edit.filed_on && (() => { const d = rtiDeadlines(edit); return <div className="rounded-2xl bg-raised p-4"><p className="font-bold">Deadlines</p><ul className="mt-2 space-y-1 text-mute">{[["Reply due", d.replyDue], ["First appeal by", d.firstAppealBy], ["First appeal decision due", d.faDecisionDue], ["Second appeal by", d.secondAppealBy]].filter(([, v]) => v).map(([l, v]) => <li key={l} className="flex justify-between"><span>{l}</span><b className="text-ink">{new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</b></li>)}</ul></div>; })()}
            {edit.draft && <details className="rounded-2xl border hair2 p-3"><summary className="cursor-pointer font-semibold">Saved draft text</summary><pre className="mt-2 whitespace-pre-wrap font-sans text-[12.5px]">{edit.draft}</pre></details>}
            {msg && <p className="rounded-xl bg-ruby/10 p-3 text-ruby">{msg}</p>}
          </div>
        </Drawer>
      )}
    </div>
  );
}

/* ---------------- Government explorer ---------------- */
function Government() {
  const [st, setSt] = useState("Karnataka");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState("district");
  const ut = utInfo(st); const nDist = districtsOf(st).length;
  const levels = LEVELS.map((lv) => {
    let roles = lv.roles;
    if (lv.id === "state" && ut) roles = [{ id: "ut-head", title: ut.head, kind: "constitutional", aka: [], basis: "Article 239", appointed: "Appointed by the President", role: `Administers the Union Territory of ${st} on behalf of the President.`, services: [] }, ...roles.filter((r) => (ut.legislature ? !["governor"].includes(r.id) : !["governor", "cm", "mla"].includes(r.id)))];
    return { ...lv, roles: roles.filter((r) => (kind === "all" || r.kind === kind) && (!q || q.toLowerCase().split(/\s+/).filter((w) => w.length > 1).every((w) => `${r.title} ${r.aka.join(" ")} ${r.role} ${r.services.join(" ")}`.toLowerCase().includes(w.replace(/s$/, ""))))) };
  }).filter((lv) => lv.roles.length && !(lv.id === "state" && false));
  const states = STATES.filter((s) => !utInfo(s)), uts = STATES.filter((s) => utInfo(s));
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[13px] font-semibold">State or Union Territory<Select value={st} onChange={(e) => setSt(e.target.value)} className="mt-1.5 block w-64"><optgroup label={`States (${states.length})`}>{states.map((s) => <option key={s}>{s}</option>)}</optgroup><optgroup label={`Union Territories (${uts.length})`}>{uts.map((s) => <option key={s}>{s}</option>)}</optgroup></Select></label>
          <div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3.5 top-3 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a role or service, e.g. caste certificate, FIR, ration card" className="w-full pl-10" aria-label="Search roles and services" /></div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-raised p-4"><p className="text-[12px] text-mute">Type</p><p className="font-display text-[18px] font-bold">{ut ? "Union Territory" : "State"}</p><p className="text-[12.5px] text-mute">{ut ? `${ut.head}${ut.legislature ? ", with an elected Legislative Assembly" : ", without a legislature"}` : "Governor, Chief Minister and Legislative Assembly"}</p></div>
          <div className="rounded-2xl bg-raised p-4"><p className="text-[12px] text-mute">Districts</p><p className="tab font-display text-[18px] font-bold">{nDist || "—"}</p><p className="text-[12.5px] text-mute">As listed in this site's location data; may change after reorganisation</p></div>
          <div className="rounded-2xl bg-raised p-4"><p className="text-[12px] text-mute">Official contacts</p><div className="mt-1 space-y-1"><Src s={GOV_SOURCES.igodStates} /><br /><Src s={GOV_SOURCES.igodDistricts} /></div></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">{[["all", "All roles"], ...Object.entries(KINDS).map(([k, [l]]) => [k, l])].map(([k, l]) => <button key={k} onClick={() => setKind(k)} className={`focusable inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold ${kind === k ? "bg-ink text-bg" : "bg-raised text-mute hover:text-ink"}`}>{k !== "all" && <span className="h-2 w-2 rounded-full" style={{ background: KINDS[k][1] }} />}{l}</button>)}</div>
      </Card>
      <ol className="space-y-3">
        {levels.map((lv, i) => (
          <li key={lv.id} className="rounded-3xl border hair bg-card">
            <button onClick={() => setOpen(open === lv.id ? null : lv.id)} aria-expanded={open === lv.id || !!q} className="focusable flex w-full items-center gap-3 p-5 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron via-indigo to-leaf font-display text-[14px] font-extrabold text-white">{i + 1}</span>
              <span className="flex-1"><span className="block font-display text-[18px] font-bold">{lv.name}{lv.id === "state" ? `: ${st}` : ""}</span><span className="text-[12.5px] text-mute">{lv.scope} · {lv.roles.length} roles</span></span>
              <ChevronDown size={18} className={`text-faint transition ${open === lv.id || q ? "rotate-180" : ""}`} />
            </button>
            {(open === lv.id || q) && <ul className="grid gap-3 px-5 pb-5 md:grid-cols-2">{lv.roles.map((r) => { const [kl, kc] = KINDS[r.kind]; return (
              <li key={r.id} className="rounded-2xl border hair2 p-4" style={{ borderLeft: `4px solid ${kc}` }}>
                <div className="flex flex-wrap items-center gap-2"><span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${kc}18`, color: kc }}>{kl}</span>{r.group && <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-semibold text-mute">{r.group}</span>}</div>
                <p className="mt-2 text-[15px] font-bold">{r.title}</p>
                {r.aka.length > 0 && <p className="text-[12px] text-faint">Also called: {r.aka.join(", ")}</p>}
                <p className="mt-1.5 text-[13.5px] text-mute">{r.role}</p>
                <dl className="mt-2 space-y-0.5 text-[12.5px]">{r.basis && <div><dt className="inline text-faint">Legal basis: </dt><dd className="inline">{r.basis}</dd></div>}{r.appointed && <div><dt className="inline text-faint">How chosen: </dt><dd className="inline">{r.appointed}</dd></div>}{r.reports && <div><dt className="inline text-faint">Reports to: </dt><dd className="inline">{r.reports}</dd></div>}</dl>
                {r.services.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{r.services.map((s) => <span key={s} className="rounded-full bg-leaf/10 px-2.5 py-1 text-[11.5px] font-semibold text-leaf">{s}</span>)}</div>}
              </li>); })}</ul>}
          </li>
        ))}
        {!levels.length && <Empty text="No roles match. Try another word." />}
      </ol>
      <p className="flex items-start gap-2 text-[12.5px] text-faint"><Info size={14} className="mt-0.5 shrink-0" />{GOV_NOTE}</p>
    </div>
  );
}

/* ---------------- Ask Your Constitution ---------------- */
const SUGGEST = ["Can the police arrest me without telling me why?", "How many days does a PIO have to reply to my RTI?", "Is education free for my 8 year old?", "Who issues caste certificates?", "What are my Fundamental Duties?", "मौलिक अधिकार क्या हैं?"];
function Ask({ docs }) {
  const search = useMemo(() => makeIndex(docs), [docs]);
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [ai, setAi] = useState(null);
  const ask = async (text) => {
    const question = (text ?? q).trim(); if (question.length < 3) return;
    setQ(question); const r = answer(question, search); setRes({ q: question, ...r }); setAi(null);
    if (r.found && import.meta.env.VITE_ASK_AI === "1" && hasSupabase()) {
      setAi({ loading: true });
      try { const { data, error } = await sb().functions.invoke("ask", { body: { question, passages: r.hits.map((h) => ({ id: h.doc.id, ref: h.doc.ref, title: h.doc.title, text: h.doc.text, source: h.doc.source.url, jurisdiction: h.doc.jurisdiction })) } }); setAi(error ? null : data); } catch { setAi(null); }
    }
  };
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <p className="text-[14px] text-mute">Ask about your rights, RTI, or which officer handles what. Answers come only from the verified knowledge base, with references. You can type in English or Hindi.</p>
        <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="mt-4 flex gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your question" className="h-12 flex-1" aria-label="Your question" maxLength={300} />
          <Btn type="submit" className="h-12 px-5"><Send size={16} />Ask</Btn>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">{SUGGEST.map((s) => <button key={s} onClick={() => ask(s)} className="focusable rounded-full bg-raised px-3 py-1.5 text-[12.5px] text-mute hover:text-ink">{s}</button>)}</div>
      </Card>
      {res && (
        <div className="space-y-3" aria-live="polite">
          {ai?.loading && <Card><p className="flex items-center gap-2 text-[13.5px] text-mute"><Loader2 size={15} className="animate-spin" />Preparing a fuller answer from the sources below</p></Card>}
          {ai?.answer && <Card title="Answer"><p className="whitespace-pre-wrap text-[14.5px] leading-relaxed">{ai.answer}</p><p className="mt-3 text-[12px] text-faint">Written by AI using only the sources listed below. Check them before relying on it.</p></Card>}
          {!res.found ? <Card><p className="text-[14px]">{res.text}</p><div className="mt-3 flex flex-wrap gap-3"><Src s={OFFICIAL.constitution} /><Src s={RTI_SOURCES.portal} /></div></Card> : (
            <>
              <Card title={ai?.answer ? "Sources" : "What the knowledge base says"}>
                <p className="text-[12px] font-bold uppercase tracking-wide text-faint">{res.lead.type} · {res.lead.ref}</p>
                <p className="mt-1 font-display text-[19px] font-bold">{res.lead.title}</p>
                <p className="mt-2 text-[14.5px] leading-relaxed">{res.lead.text}</p>
                {res.lead.example && <p className="mt-3 rounded-2xl bg-saffron/5 p-3 text-[13.5px]"><b>Example:</b> {res.lead.example}</p>}
                <p className="mt-3 text-[12.5px] text-mute">Applies to: {res.lead.jurisdiction}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3"><Src s={res.lead.source} /><Reviewed d={res.lead} /></div>
              </Card>
              {res.related.length > 0 && <Card title="Related"><ul className="divide-y hair">{res.related.map((d) => <li key={d.id} className="py-3"><p className="text-[12px] font-bold uppercase tracking-wide text-faint">{d.type} · {d.ref}</p><p className="text-[14px] font-semibold">{d.title}</p><p className="text-[13.5px] text-mute">{d.text}</p><div className="mt-1"><Src s={d.source} /></div></li>)}</ul></Card>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
