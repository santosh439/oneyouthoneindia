import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Plus, RefreshCw, CheckCircle2, AlertTriangle, CalendarClock, Archive, Undo2, Eye, FileText, Database, History, X, Check, Trash2 } from "lucide-react";
import { COLLECTIONS, SOURCES, fieldsFor, sourceRows, BUILD_ID } from "../cms.js";
import { cmsItems, cmsRevisions, cmsCreate, cmsSave, cmsAccept, cmsRollback, cmsImport, syncRuns, names as getNames, fmt } from "./api.js";
import { Kpi, Drawer, Empty, Card, Input, Select, Btn } from "./ui.jsx";

const live = (it) => it.status === "published" && (!it.publish_at || new Date(it.publish_at) <= new Date());
const scheduled = (it) => it.status === "published" && it.publish_at && new Date(it.publish_at) > new Date();
function StateBadge({ it }) {
  const [l, c] = scheduled(it) ? ["Scheduled", "#7C3AED"] : live(it) ? ["Published", "#13A86B"] : it.status === "archived" ? ["Archived", "#6B7280"] : ["Draft", "#B45309"];
  return <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold" style={{ background: `${c}17`, color: c }}>{l}</span>;
}
const SITE_NAMES = { contact: "Contact details", seo: "Search engine title and description", announcement: "Homepage announcement banner", about: "About page", what_we_do: "What we do page", how_we_help: "How we help page" };
const title = (it) => (it.collection === "site" && SITE_NAMES[it.key]) || it.data?.name || it.data?.title || it.data?.label || it.key;

/* ===================== Website content ===================== */
export function ContentTab({ me, goSync }) {
  const [items, setItems] = useState(null);
  const [col, setCol] = useState("helplines");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const load = () => cmsItems().then(setItems).catch((e) => { setMsg(e.message); setItems([]); });
  useEffect(() => { load(); }, []);
  const C = COLLECTIONS.find((c) => c.id === col);
  const list = useMemo(() => (items || []).filter((i) => i.collection === col).filter((i) => !q || `${i.key} ${JSON.stringify(i.data)}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (a.data?.order ?? 999) - (b.data?.order ?? 999) || a.key.localeCompare(b.key)), [items, col, q]);
  const drafts = list.filter((i) => i.status === "draft");
  const staged = (items || []).filter((i) => i.staged_data);
  const publishAll = async () => {
    if (!confirm(`Publish all ${drafts.length} drafts in ${C.name}? They will appear on the live site.`)) return;
    setMsg(""); try { for (const it of drafts) await cmsSave(it.id, { status: "published", note: "Bulk publish" }); load(); } catch (e) { setMsg(e.message); }
  };
  if (items === null) return <p className="flex items-center gap-2 text-mute"><Loader2 size={16} className="animate-spin" />Loading content</p>;
  if (!items.length) return (
    <Card><Empty icon={Database} text="No website content in the database yet. Run Website Data Sync once to import the content that is currently built into the site." /><div className="mt-4 text-center"><Btn onClick={goSync}><RefreshCw size={15} />Open Website Data Sync</Btn></div></Card>
  );
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Content items" value={items.length} icon={FileText} />
        <Kpi label="Published" value={items.filter(live).length} icon={CheckCircle2} color="#13A86B" />
        <Kpi label="Drafts" value={items.filter((i) => i.status === "draft").length} icon={Eye} color="#B45309" />
        <Kpi label="Source updates to review" value={staged.length} icon={AlertTriangle} color="#E5484D" />
      </div>
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {COLLECTIONS.map((c) => { const n = items.filter((i) => i.collection === c.id); return (
          <button key={c.id} onClick={() => { setCol(c.id); setQ(""); }} className={`focusable whitespace-nowrap rounded-full px-4 py-2 text-[13.5px] font-semibold ${col === c.id ? "bg-ink text-bg" : "bg-raised text-mute hover:text-ink"}`}>
            {c.name} <span className="opacity-60">{n.length}</span>{n.some((i) => i.staged_data) && <span className="ml-1.5 inline-block h-2 w-2 rounded-full bg-ruby" />}
          </button>); })}
      </div>
      <Card title={C.name} action={<div className="flex flex-wrap gap-2">
        {drafts.length > 0 && <Btn tone="leaf" onClick={publishAll}><CheckCircle2 size={15} />Publish {drafts.length} drafts</Btn>}
        {C.canAdd && <Btn tone="soft" onClick={() => setAdding(true)}><Plus size={15} />Add</Btn>}
      </div>}>
        <p className="-mt-2 mb-4 text-[13px] text-mute">{C.help}</p>
        {msg && <p className="mb-3 rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
        <div className="relative mb-4"><Search size={16} className="absolute left-3.5 top-3 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${C.name.toLowerCase()}`} className="w-full pl-10" aria-label="Search content" /></div>
        {!list.length ? <Empty text="Nothing here yet." /> : (
          <ul className="divide-y hair">
            {list.map((it) => (
              <li key={it.id}><button onClick={() => setOpen(it)} className="focusable flex w-full items-center gap-3 py-3 text-left hover:bg-raised/60">
                <span className="w-24 shrink-0 truncate font-mono text-[12px] text-mute">{it.key}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{title(it)}</span>{(it.data?.note || it.data?.hint || it.data?.text) && <span className="block truncate text-[12.5px] text-mute">{it.data.note || it.data.hint || it.data.text}</span>}</span>
                {it.data?.hidden && <span className="rounded-full bg-raised px-2 py-0.5 text-[11px] font-semibold text-mute">Hidden</span>}
                {it.staged_data && <span className="rounded-full bg-ruby/10 px-2 py-0.5 text-[11px] font-bold text-ruby">Source update</span>}
                <StateBadge it={it} /><span className="hidden w-20 text-right text-[11.5px] text-faint sm:block">v{it.version}</span>
              </button></li>
            ))}
          </ul>
        )}
      </Card>
      {open && <Editor it={(items || []).find((x) => x.id === open.id) || open} onClose={() => setOpen(null)} onChanged={load} />}
      {adding && <AddItem C={C} existing={items.filter((i) => i.collection === col).map((i) => i.key)} onClose={() => setAdding(false)} onDone={(it) => { setAdding(false); load().then(() => setOpen(it)); }} />}
    </div>
  );
}

function AddItem({ C, existing, onClose, onDone }) {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const create = async () => {
    const k = key.trim(); if (!k) return setErr(`Enter a ${C.keyLabel.toLowerCase()}`);
    if (existing.includes(k)) return setErr("That already exists.");
    if (C.id === "channels" && !/^[a-z0-9_]+$/.test(k)) return setErr("Use lowercase letters, numbers and underscores only.");
    try { onDone(await cmsCreate(C.id, k, C.id === "helplines" ? { n: k, label: "", order: 999 } : { name: "", note: "" })); } catch (e) { setErr(e.message); }
  };
  return (
    <Drawer title={`Add to ${C.name}`} onClose={onClose} footer={<div className="flex gap-2"><Btn onClick={create}>Create draft</Btn><Btn tone="soft" onClick={onClose}>Cancel</Btn></div>}>
      <label className="block text-[13px] font-semibold">{C.keyLabel}<Input value={key} onChange={(e) => setKey(e.target.value)} className="mt-1.5 w-full" placeholder={C.id === "helplines" ? "e.g. 1800 11 4000" : "e.g. state_portal"} /></label>
      <p className="mt-3 text-[12.5px] text-mute">It is created as a draft. Fill in the details, then publish when ready.</p>
      {err && <p className="mt-3 rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{err}</p>}
    </Drawer>
  );
}

function Field({ f, value, onChange }) {
  const [k, label, type, opts] = f;
  const cls = "focusable mt-1.5 w-full rounded-2xl border hair2 bg-card p-3 text-[13.5px] outline-none";
  if (type === "bool") return <label className="flex items-center gap-2 text-[13.5px] font-semibold"><input type="checkbox" checked={!!value} onChange={(e) => onChange(k, e.target.checked)} />{label}</label>;
  if (type === "textarea") return <label className="block text-[13px] font-semibold">{label}<textarea rows={3} value={value || ""} onChange={(e) => onChange(k, e.target.value)} className={cls} />{k === "description" && <span className="text-[11.5px] font-normal text-faint">{(value || "").length} characters</span>}</label>;
  if (type === "lines") return <label className="block text-[13px] font-semibold">{label}<textarea rows={5} value={(value || []).join("\n")} onChange={(e) => onChange(k, e.target.value.split("\n"))} className={cls} /></label>;
  if (type === "select") return <label className="block text-[13px] font-semibold">{label}<Select value={value || opts[0]} onChange={(e) => onChange(k, e.target.value)} className="mt-1.5 w-full">{opts.map((o) => <option key={o}>{o}</option>)}</Select></label>;
  if (type === "color") return <div className="text-[13px] font-semibold">{label}<span className="mt-1.5 flex items-center gap-2">{value ? <><input type="color" value={value} onChange={(e) => onChange(k, e.target.value)} className="h-10 w-14 rounded-lg" aria-label={label} /><button type="button" onClick={() => onChange(k, undefined)} className="text-[12px] text-mute underline">Remove colour</button></> : <Btn tone="soft" type="button" onClick={() => onChange(k, "#E5484D")}>Set a colour</Btn>}</span></div>;
  if (type === "pairs") return (
    <div className="text-[13px] font-semibold">{label}
      <div className="mt-2 space-y-3">
        {(value || []).map(([h, t], i) => (
          <div key={i} className="rounded-2xl border hair2 p-3">
            <div className="flex gap-2"><Input value={h} onChange={(e) => onChange(k, value.map((x, j) => (j === i ? [e.target.value, x[1]] : x)))} placeholder="Heading" className="flex-1 rounded-xl" />
              <button type="button" onClick={() => onChange(k, value.filter((_, j) => j !== i))} className="focusable rounded-full p-2 text-mute hover:bg-raised" aria-label="Remove section"><Trash2 size={15} /></button></div>
            <textarea rows={4} value={t} onChange={(e) => onChange(k, value.map((x, j) => (j === i ? [x[0], e.target.value] : x)))} className={cls} />
          </div>
        ))}
        <Btn tone="soft" type="button" onClick={() => onChange(k, [...(value || []), ["", ""]])}><Plus size={15} />Add section</Btn>
      </div>
    </div>
  );
  return <label className="block text-[13px] font-semibold">{label}<Input type={type === "number" ? "number" : type === "url" ? "url" : "text"} value={value ?? ""} onChange={(e) => onChange(k, type === "number" ? (e.target.value === "" ? undefined : Number(e.target.value)) : e.target.value)} className="mt-1.5 w-full rounded-2xl" /></label>;
}

function clean(collection, data) {
  const d = { ...data };
  Object.keys(d).forEach((k) => { if (d[k] === undefined || d[k] === "") delete d[k]; });
  ["subs", "channels"].forEach((k) => { if (Array.isArray(d[k])) d[k] = d[k].map((x) => x.trim()).filter(Boolean); });
  ["sections", "items", "audiences"].forEach((k) => { if (Array.isArray(d[k])) d[k] = d[k].filter(([h, t]) => h.trim() || t.trim()); });
  return d;
}
function validate(collection, key, d) {
  if (collection === "helplines" && (!d.n || !d.label)) return "Number and description are required.";
  if (collection === "channels" && !d.name) return "Name is required.";
  if (collection === "channels" && d.href && !/^https:\/\//.test(d.href)) return "Website links must start with https://";
  if (collection === "knowledge" && d.source_url && !/^https:\/\/([a-z0-9-]+\.)*(gov|nic)\.in(\/|$)/i.test(d.source_url)) return "Official source links must be government websites (gov.in or nic.in).";
  if (collection === "knowledge" && d.verified && !d.verified_on) return "Add the date you verified this entry.";
  if (collection === "legal" && (!d.title || !d.sections?.length)) return "A title and at least one section are required.";
  if (collection === "site" && ["about", "what_we_do", "how_we_help"].includes(key) && (!d.title || !d.items?.length)) return "A heading and at least one card are required.";
  if (collection === "site" && key === "contact" && d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return "Enter a valid email address.";
  return "";
}

function Editor({ it, onClose, onChanged }) {
  const [data, setData] = useState(it.data || {});
  const [revs, setRevs] = useState(null);
  const [revNames, setRevNames] = useState({});
  const [when, setWhen] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("edit");
  const fields = fieldsFor(it.collection, it.key);
  useEffect(() => { setData(it.data || {}); }, [it.id, it.version]);
  useEffect(() => { cmsRevisions(it.id).then((r) => { setRevs(r); getNames(r.map((x) => x.actor)).then(setRevNames); }).catch(() => setRevs([])); }, [it.id, it.version]);
  const dirty = JSON.stringify(clean(it.collection, data)) !== JSON.stringify(clean(it.collection, it.data || {}));
  const run = async (k, fn) => { setBusy(k); setMsg(""); try { await fn(); setNote(""); await onChanged(); } catch (e) { setMsg(e.message); } setBusy(""); };
  const save = (status, extra = {}) => {
    const d = clean(it.collection, data); const v = validate(it.collection, it.key, d);
    if (v && status !== "archived") return setMsg(v);
    return run(status || "save", () => cmsSave(it.id, { data: dirty ? d : null, status, note: note || null, ...extra }));
  };
  const changes = it.staged_data ? Object.keys({ ...it.data, ...it.staged_data }).filter((k) => JSON.stringify(it.data?.[k]) !== JSON.stringify(it.staged_data?.[k])) : [];
  return (
    <Drawer title={`${COLLECTIONS.find((c) => c.id === it.collection)?.name}: ${it.key}`} onClose={onClose}
      footer={tab === "edit" && <div className="flex flex-wrap gap-2">
        <Btn disabled={!!busy || !dirty} onClick={() => save(null)}>{busy === "save" ? <Loader2 size={15} className="animate-spin" /> : "Save draft"}</Btn>
        <Btn tone="leaf" disabled={!!busy} onClick={() => save("published", { clearSchedule: true })}><CheckCircle2 size={15} />{live(it) && !dirty ? "Published" : "Publish now"}</Btn>
        {it.status === "published" && <Btn tone="soft" disabled={!!busy} onClick={() => save("draft")}>Unpublish</Btn>}
        {it.status !== "archived" && it.collection !== "site" && it.collection !== "legal" && <Btn tone="soft" disabled={!!busy} onClick={() => save("archived")}><Archive size={15} />Archive</Btn>}
      </div>}>
      <div className="mb-4 flex flex-wrap items-center gap-2"><StateBadge it={it} /><span className="text-[12px] text-faint">Version {it.version} · updated {fmt(it.updated_at)}{it.source ? ` · source ${it.source}` : ""}</span></div>
      {scheduled(it) && <p className="mb-4 flex items-center gap-2 rounded-2xl bg-indigo/10 p-3 text-[13px] text-indigo"><CalendarClock size={16} />Goes live on {fmt(it.publish_at)}</p>}
      {it.staged_data && (
        <div className="mb-5 rounded-2xl border border-ruby/30 bg-ruby/5 p-4">
          <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-ruby"><AlertTriangle size={15} />The source changed since this was imported</p>
          <p className="mt-1 text-[12.5px] text-mute">Imported {fmt(it.staged_at)}. Your current text is unchanged until you accept.</p>
          <ul className="mt-3 space-y-2 text-[12.5px]">{changes.map((k) => <li key={k} className="rounded-xl bg-card p-2.5"><b>{k}</b><div className="mt-1 grid gap-1 sm:grid-cols-2"><span className="text-ruby line-through decoration-ruby/50">{JSON.stringify(it.data?.[k] ?? "")}</span><span className="text-leaf">{JSON.stringify(it.staged_data?.[k] ?? "")}</span></div></li>)}</ul>
          <div className="mt-3 flex gap-2"><Btn tone="ink" disabled={!!busy} onClick={() => run("acc", () => cmsAccept(it.id, true))}><Check size={15} />Accept update</Btn><Btn tone="soft" disabled={!!busy} onClick={() => run("dis", () => cmsAccept(it.id, false))}><X size={15} />Keep current</Btn></div>
        </div>
      )}
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl bg-raised p-1">
        {[["edit", "Edit"], ["preview", "Preview"], ["history", "History"]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`focusable h-9 rounded-xl text-[13px] font-semibold ${tab === k ? "bg-card shadow" : "text-mute"}`}>{l}</button>)}
      </div>
      {tab === "edit" && (
        <div className="space-y-4">
          {fields.map((f) => <Field key={f[0]} f={f} value={data[f[0]]} onChange={(k, v) => setData((d) => ({ ...d, [k]: v }))} />)}
          <label className="block text-[13px] font-semibold">Change note (optional, saved in history)<Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5 w-full rounded-2xl" placeholder="e.g. Verified number with state portal" /></label>
          <div className="rounded-2xl border hair2 p-3">
            <p className="text-[13px] font-semibold">Schedule publication</p>
            <div className="mt-2 flex flex-wrap gap-2"><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
              <Btn tone="indigo" disabled={!!busy || !when} onClick={() => save("published", { publishAt: new Date(when).toISOString() })}><CalendarClock size={15} />Schedule</Btn>
              {it.publish_at && <Btn tone="soft" disabled={!!busy} onClick={() => save(null, { clearSchedule: true })}>Clear schedule</Btn>}</div>
          </div>
        </div>
      )}
      {tab === "preview" && <Preview collection={it.collection} k={it.key} d={clean(it.collection, data)} />}
      {tab === "history" && (!revs ? <Loader2 size={16} className="animate-spin" /> : (
        <ul className="space-y-2">{revs.map((r) => (
          <li key={r.id} className="rounded-2xl border hair2 p-3 text-[13px]">
            <div className="flex items-center gap-2"><b>Version {r.version}</b><span className="text-mute">· {r.status}</span><span className="ml-auto text-[11.5px] text-faint">{fmt(r.created_at)}</span></div>
            <p className="mt-0.5 text-[12.5px] text-mute">{r.note || "Edited"}{revNames[r.actor] ? ` · ${revNames[r.actor]}` : ""}</p>
            {r.version !== it.version && <Btn tone="soft" className="mt-2 h-8 px-3 text-[12px]" disabled={!!busy} onClick={() => { if (confirm(`Restore version ${r.version}? This creates a new version; publish it to make it live.`)) run("rb", () => cmsRollback(it.id, r.version)); }}><Undo2 size={13} />Restore this version</Btn>}
          </li>))}</ul>
      ))}
      {msg && <p className="mt-4 rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
    </Drawer>
  );
}

function Preview({ collection, k, d }) {
  const box = "rounded-2xl border hair2 bg-card p-4";
  if (collection === "helplines") return <div className={box} style={d.tone ? { borderColor: d.tone } : {}}><p className="font-display text-[28px] font-extrabold" style={{ color: d.tone || undefined }}>{d.n}</p><p className="text-[13.5px] text-mute">{d.label}</p>{d.hidden && <p className="mt-2 text-[12px] text-ruby">Hidden: not shown on the site</p>}</div>;
  if (collection === "channels") return <div className={box}><p className="text-[15px] font-bold">{d.name}</p><p className="text-[13px] text-mute">{d.note}</p><div className="mt-2 flex gap-3 text-[13px] text-indigo">{d.tel && <span>Call {d.tel}</span>}{d.href && <span>{d.href}</span>}</div></div>;
  if (collection === "categories") return <div className={box}><p className="text-[15px] font-bold">{d.name}</p><p className="text-[13px] text-mute">{d.hint}</p><div className="mt-3 flex flex-wrap gap-1.5">{(d.subs || []).map((s) => <span key={s} className="rounded-full bg-raised px-2.5 py-1 text-[12px]">{s}</span>)}</div></div>;
  if (collection === "legal") return <div className={box}><h3 className="font-display text-[20px] font-bold">{d.title}</h3>{(d.sections || []).map(([h, t], i) => <div key={i} className="mt-3"><p className="text-[14px] font-bold">{h}</p><p className="text-[13.5px] text-ink/80">{t}</p></div>)}</div>;
  if (k === "announcement") return d.active && d.text ? <div className={`rounded-2xl px-4 py-3 text-[14px] font-medium ${{ info: "bg-indigo text-white", warning: "bg-sun text-ink", success: "bg-leaf text-white" }[d.tone || "info"]}`}>{d.text}{d.link && <span className="ml-2 underline">Learn more</span>}</div> : <p className="text-[13px] text-mute">Banner is switched off.</p>;
  if (["about", "what_we_do", "how_we_help"].includes(k)) return <div className={box}><h3 className="font-display text-[22px] font-bold">{d.title}</h3><p className="mt-1 text-[13.5px] text-mute">{d.intro}</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{[...(d.items || []), ...(d.audiences || [])].map(([h, t], i) => <div key={i} className="rounded-xl bg-raised p-3"><p className="text-[13.5px] font-bold">{h}</p><p className="text-[12.5px] text-mute">{t}</p></div>)}</div></div>;
  if (k === "seo") return <div className={box}><p className="text-[18px] text-indigo">{d.title}</p><p className="text-[12.5px] text-leaf">www.oneyouthoneindia.com</p><p className="mt-1 text-[13px] text-mute">{d.description}</p></div>;
  return <pre className="overflow-x-auto rounded-2xl bg-raised p-3 text-[12px]">{JSON.stringify(d, null, 2)}</pre>;
}

/* ===================== Website Data Sync ===================== */
export async function runSync(mode = "manual") {
  const results = [];
  for (const s of SOURCES) {
    try { results.push(await cmsImport(s.id, await sourceRows(s.id), mode, BUILD_ID)); }
    catch (e) { results.push({ source: s.id, status: "failed", errors: [{ key: s.id, error: e.message }] }); }
  }
  return results;
}

export function SyncTab({ goContent }) {
  const [runs, setRuns] = useState(null);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [openRun, setOpenRun] = useState(null);
  const load = () => Promise.all([syncRuns(), cmsItems()]).then(([r, i]) => { setRuns(r); setItems(i); }).catch((e) => { setMsg(e.message); setRuns([]); });
  useEffect(() => { load(); }, []);
  const sync = async () => { setBusy(true); setMsg(""); const r = await runSync("manual"); const bad = r.filter((x) => x.status === "failed"); if (bad.length) setMsg(bad.map((b) => b.errors?.[0]?.error).join("; ")); await load(); setBusy(false); };
  const last = (src) => (runs || []).find((r) => r.source === src);
  const staged = items.filter((i) => i.staged_data).length;
  const tone = { success: "#13A86B", partial: "#B45309", failed: "#E5484D", running: "#3B3FD8" };
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-1 text-[14px] text-mute">Imports the content currently built into the site into the database. New items arrive as drafts; changes to existing items are staged for review and never overwrite edits. The portal also syncs automatically the first time it is opened after each deployment.</p>
        <Btn onClick={sync} disabled={busy}>{busy ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}Sync now</Btn>
      </div>
      {msg && <p className="rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Items in database" value={items.length} icon={Database} />
        <Kpi label="Sync runs" value={(runs || []).length} icon={History} color="#7C3AED" />
        <Kpi label="Last sync" value={runs?.[0] ? new Date(runs[0].started_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Never"} icon={RefreshCw} color="#13A86B" hint={runs?.[0] ? new Date(runs[0].started_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : ""} />
        <Kpi label="Updates to review" value={staged} icon={AlertTriangle} color="#E5484D" onClick={staged ? goContent : undefined} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {SOURCES.map((s) => { const r = last(s.id); return (
          <Card key={s.id}>
            <p className="font-mono text-[11.5px] text-faint">{s.id}</p><p className="mt-1 text-[15px] font-bold">{s.name}</p><p className="text-[12.5px] text-mute">{s.detail}</p>
            {r ? <div className="mt-3 text-[12.5px]"><span className="rounded-full px-2 py-0.5 font-bold" style={{ background: `${tone[r.status]}17`, color: tone[r.status] }}>{r.status}</span><span className="ml-2 text-mute">{fmt(r.started_at)}</span>
              <p className="mt-2 text-mute">{r.total} records · {r.imported} new · {r.changed} changed · {r.unchanged} unchanged{r.failed ? ` · ${r.failed} failed` : ""}</p></div>
              : <p className="mt-3 text-[12.5px] text-faint">Not synced yet</p>}
          </Card>); })}
      </div>
      <Card title="Import history">
        {runs === null ? <Loader2 size={16} className="animate-spin" /> : !runs.length ? <Empty text="No sync has run yet. Click Sync now to import the site's content." /> : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead><tr className="border-b hair2 text-[11.5px] uppercase tracking-wide text-faint">{["Started", "Source", "Mode", "Status", "Records", "New", "Changed", "Unchanged", "Failed", "Build"].map((h) => <th key={h} className="py-2.5 pr-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{runs.map((r) => (
                <tr key={r.id} onClick={() => r.failed && setOpenRun(r)} className={`border-b hair ${r.failed ? "cursor-pointer hover:bg-raised/60" : ""}`}>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-mute">{fmt(r.started_at)}</td><td className="py-2.5 pr-3 font-mono text-[12px]">{r.source}</td><td className="py-2.5 pr-3">{r.mode}</td>
                  <td className="py-2.5 pr-3"><span className="rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: `${tone[r.status]}17`, color: tone[r.status] }}>{r.status}</span></td>
                  {["total", "imported", "changed", "unchanged", "failed"].map((k) => <td key={k} className={`tab py-2.5 pr-3 ${k === "failed" && r.failed ? "font-bold text-ruby" : ""}`}>{r[k]}</td>)}
                  <td className="py-2.5 font-mono text-[11px] text-faint">{r.build}</td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </Card>
      {openRun && <Drawer title={`Errors: ${openRun.source}`} onClose={() => setOpenRun(null)}><ul className="space-y-2 text-[13px]">{openRun.errors.map((e, i) => <li key={i} className="rounded-xl bg-ruby/5 p-3"><b>{e.key}</b><p className="text-ruby">{e.error}</p></li>)}</ul><Btn className="mt-4" onClick={() => { setOpenRun(null); sync(); }}><RefreshCw size={15} />Retry sync</Btn></Drawer>}
    </div>
  );
}
