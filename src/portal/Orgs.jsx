import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Building2, CheckCircle2, Download, ExternalLink, Hourglass, Loader2, Plus, Search, ShieldCheck, Trash2, UserPlus, XCircle } from "lucide-react";
import { CATEGORIES, STATES } from "../data.js";
import { CHECKED_ON, officialOrgRows } from "../directory.js";
import { listOrgs, saveOrg, createOrg, importOrgs, setOrgRep, orgReps, listUsers, fmt, ADMIN } from "./api.js";
import { Card, Drawer, Empty, Input, Kpi, Select, Btn } from "./ui.jsx";

const blank = { name: "", sector: "private", category: "", subcategory: "", state: "", city: "", website: "", source_label: "", source_url: "", verified: false, status: "published" };

export function OrgsTab({ me }) {
  const [rows, setRows] = useState(null);
  const [f, setF] = useState({ q: "", sector: "all", status: "all" });
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const isAdmin = ADMIN.includes(me.role);
  const load = useCallback(() => listOrgs(f).then(setRows).catch((e) => { setMsg(e.message); setRows([]); }), [f]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);
  const all = rows || [];
  const counts = useMemo(() => ({ pub: all.filter((o) => o.status === "published").length, ver: all.filter((o) => o.verified).length, pend: all.filter((o) => o.status === "pending").length }), [all]);

  const runImport = async () => {
    const data = officialOrgRows();
    if (!confirm(`Import or refresh ${data.length} official government organisations from the checked directory? Existing records are updated, never duplicated.`)) return;
    setBusy("import"); setMsg("");
    try { const n = await importOrgs(data); setMsg(`Imported or refreshed ${n} organisations.`); load(); } catch (e) { setMsg(e.message); }
    setBusy("");
  };
  const quick = async (o, patch, label) => {
    setBusy(o.id + label); setMsg("");
    try { await saveOrg(o.id, patch); load(); } catch (e) { setMsg(/organizations_verified_source/.test(e.message) ? "Add an official source link before marking it verified." : e.message); }
    setBusy("");
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Published" value={counts.pub} icon={Building2} />
        <Kpi label="Verified" value={counts.ver} icon={BadgeCheck} color="#13A86B" />
        <Kpi label="Suggestions to review" value={counts.pend} icon={Hourglass} color="#FF7A2F" onClick={() => setF({ ...f, status: "pending" })} active={f.status === "pending"} />
        <Kpi label="Shown" value={all.length} icon={Search} color="#7C3AED" />
      </div>
      <Card title="Organisation directory" action={<div className="flex flex-wrap gap-2"><Btn tone="soft" onClick={runImport} disabled={busy === "import"}>{busy === "import" ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}Import official government list</Btn><Btn onClick={() => setEdit({ ...blank })}><Plus size={15} />Add organisation</Btn></div>}>
        <p className="-mt-2 mb-4 text-[13px] text-mute">Organisations people can choose when sharing an experience. Citizen suggestions arrive as unverified and pending. Mark an organisation verified only after checking an official source; the source and date are recorded. Government addresses were last checked by hand on {CHECKED_ON}.</p>
        <div className="mb-4 flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3.5 top-3 text-faint" /><Input value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} placeholder="Search organisations" aria-label="Search organisations" className="w-full pl-10" /></div>
          <Select value={f.sector} onChange={(e) => setF({ ...f, sector: e.target.value })} aria-label="Sector"><option value="all">All sectors</option><option value="government">Government</option><option value="private">Private</option></Select>
          <Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} aria-label="Status"><option value="all">All statuses</option><option value="pending">Pending review</option><option value="published">Published</option><option value="rejected">Rejected</option></Select>
        </div>
        {msg && <p className="mb-3 rounded-xl bg-indigo/10 p-3 text-[13px] text-indigo">{msg}</p>}
        {rows === null ? <Loader2 size={16} className="animate-spin" /> : !all.length ? <Empty icon={Building2} text="No organisations yet. Import the official government list, or add verified organisations." /> : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full min-w-[860px] text-left text-[13px]">
              <thead><tr className="border-b hair2 text-[11.5px] uppercase tracking-wide text-faint">{["Organisation", "Sector", "Location", "Status", "Verification", ""].map((h) => <th key={h} className="py-2 pr-3 font-semibold">{h}</th>)}</tr></thead>
              <tbody>{all.map((o) => (
                <tr key={o.id} className="border-b hair align-top">
                  <td className="py-3 pr-3"><p className="flex items-center gap-1.5 font-semibold">{o.name}{o.verified && <BadgeCheck size={14} className="text-leaf" />}</p><p className="text-[12px] text-mute">{[CATEGORIES.find((c) => c.id === o.category)?.name || o.category, o.subcategory].filter(Boolean).join(" · ")}</p>{o.website && <a href={o.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[12px] text-indigo hover:underline">{o.website.replace(/^https:\/\//, "")}<ExternalLink size={11} /></a>}</td>
                  <td className="py-3 pr-3">{o.sector === "private" ? "Private" : "Government"}</td>
                  <td className="py-3 pr-3 text-mute">{[o.city, o.state].filter(Boolean).join(", ") || "All India"}</td>
                  <td className="py-3 pr-3"><span className={`rounded-full px-2.5 py-1 text-[11.5px] font-bold ${o.status === "published" ? "bg-leaf/10 text-leaf" : o.status === "pending" ? "bg-saffron/10 text-saffron" : "bg-ruby/10 text-ruby"}`}>{o.status === "pending" ? "Pending review" : o.status === "published" ? "Published" : "Rejected"}</span>{!o.created_by || o.source_url ? null : <p className="mt-1 text-[11.5px] text-faint">Suggested by a user</p>}</td>
                  <td className="py-3 pr-3 text-[12px]">{o.verified ? <span className="text-leaf">Verified {fmt(o.last_verified_at)}</span> : <span className="text-mute">Not verified</span>}{o.source_url && <a href={o.source_url} target="_blank" rel="noopener noreferrer" className="block truncate text-indigo hover:underline">Source</a>}</td>
                  <td className="py-3"><div className="flex flex-wrap justify-end gap-1.5">
                    {o.status === "pending" && <Btn tone="soft" className="h-8 px-3 text-[12px]" disabled={!!busy} onClick={() => quick(o, { status: "published" }, "pub")}><CheckCircle2 size={14} />Publish</Btn>}
                    {o.status !== "rejected" && !o.verified && <Btn tone="soft" className="h-8 px-3 text-[12px]" disabled={!!busy} onClick={() => quick(o, { status: "rejected" }, "rej")}><XCircle size={14} />Reject</Btn>}
                    <Btn tone="soft" className="h-8 px-3 text-[12px]" onClick={() => setEdit({ ...o })}>Edit</Btn>
                  </div></td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </Card>
      {edit && <OrgEditor o={edit} isAdmin={isAdmin} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function OrgEditor({ o, isAdmin, onClose, onSaved }) {
  const [d, setD] = useState(o);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setD((x) => ({ ...x, [k]: v }));
  const save = async () => {
    if (d.name.trim().length < 2) return setMsg("Add the organisation's name.");
    if (d.website && !/^https:\/\//.test(d.website)) return setMsg("Website must start with https://");
    if (d.verified && !/^https:\/\//.test(d.source_url || "")) return setMsg("A verified organisation needs an official source link (https://).");
    const row = { name: d.name.trim(), sector: d.sector, category: d.category || null, subcategory: d.subcategory || null, state: d.state || null, city: d.city || null, website: d.website || null,
      source_label: d.source_label || null, source_url: d.source_url || null, verified: !!d.verified, status: d.status,
      last_verified_at: d.verified ? (o.verified && o.last_verified_at ? o.last_verified_at : new Date().toISOString()) : null };
    setBusy(true); setMsg("");
    try { if (o.id) await saveOrg(o.id, row); else await createOrg(row); onSaved(); } catch (e) { setMsg(/duplicate/i.test(e.message) ? "An organisation with this name already exists in this sector and place." : e.message); }
    setBusy(false);
  };
  const lbl = "block text-[13px] font-semibold"; const inp = "mt-1.5 w-full rounded-2xl";
  return (
    <Drawer title={o.id ? "Edit organisation" : "Add organisation"} onClose={onClose} footer={<Btn onClick={save} disabled={busy}>{busy && <Loader2 size={15} className="animate-spin" />}Save</Btn>}>
      <div className="space-y-4">
        <label className={lbl}>Name<Input value={d.name} onChange={(e) => set("name", e.target.value)} className={inp} maxLength={160} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className={lbl}>Sector<Select value={d.sector} onChange={(e) => set("sector", e.target.value)} className="mt-1.5 w-full"><option value="government">Government</option><option value="private">Private</option></Select></label>
          <label className={lbl}>Category<Select value={d.category || ""} onChange={(e) => set("category", e.target.value)} className="mt-1.5 w-full"><option value="">Choose</option>{CATEGORIES.filter((c) => c.sector === d.sector).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}{d.category && !CATEGORIES.some((c) => c.id === d.category) && <option value={d.category}>{d.category}</option>}</Select></label>
          <label className={lbl}>State (blank for All India)<Select value={d.state || ""} onChange={(e) => set("state", e.target.value)} className="mt-1.5 w-full"><option value="">All India</option>{STATES.map((s) => <option key={s}>{s}</option>)}</Select></label>
          <label className={lbl}>City<Input value={d.city || ""} onChange={(e) => set("city", e.target.value)} className={inp} /></label>
        </div>
        <label className={lbl}>Official website<Input value={d.website || ""} onChange={(e) => set("website", e.target.value)} className={inp} placeholder="https://" /></label>
        <div className="rounded-2xl bg-raised p-4">
          <p className="flex items-center gap-1.5 text-[13.5px] font-bold"><ShieldCheck size={15} className="text-leaf" />Verification</p>
          <p className="mt-1 text-[12.5px] text-mute">Only mark verified after confirming the organisation from an official source, such as its own website, a government directory or a regulator's register.</p>
          <label className={`${lbl} mt-3`}>Source name<Input value={d.source_label || ""} onChange={(e) => set("source_label", e.target.value)} className={inp} placeholder="e.g. Company's official website" /></label>
          <label className={`${lbl} mt-3`}>Source link<Input value={d.source_url || ""} onChange={(e) => set("source_url", e.target.value)} className={inp} placeholder="https://" /></label>
          <label className="mt-3 flex items-center gap-2 text-[13.5px] font-semibold"><input type="checkbox" checked={!!d.verified} onChange={(e) => set("verified", e.target.checked)} className="h-4 w-4 accent-indigo" />Verified from this source{o.verified && o.last_verified_at ? ` (last verified ${fmt(o.last_verified_at)})` : ""}</label>
        </div>
        <label className={lbl}>Directory status<Select value={d.status} onChange={(e) => set("status", e.target.value)} className="mt-1.5 w-full"><option value="published">Published</option><option value="pending">Pending review</option><option value="rejected">Rejected</option></Select></label>
        {msg && <p className="rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{msg}</p>}
        {o.id && isAdmin && <Reps org={o} />}
      </div>
    </Drawer>
  );
}

/* Admins link verified organisations to their authorised representatives. */
function Reps({ org }) {
  const [reps, setReps] = useState(null);
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const load = () => Promise.all([orgReps(org.id), listUsers()]).then(([r, u]) => { setReps(r); setUsers(u); }).catch((e) => { setMsg(e.message); setReps([]); });
  useEffect(() => { load(); }, [org.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const who = (id) => users.find((u) => u.id === id);
  const add = async () => {
    const u = users.find((x) => (x.email || "").toLowerCase() === email.trim().toLowerCase());
    if (!u) return setMsg("No account with that email. The representative must sign up first.");
    try { await setOrgRep(u.id, org.id, true); setEmail(""); setMsg(""); load(); } catch (e) { setMsg(e.message); }
  };
  const remove = async (id) => { if (!confirm("Remove this representative?")) return; try { await setOrgRep(id, org.id, false); load(); } catch (e) { setMsg(e.message); } };
  return (
    <div className="rounded-2xl border hair2 p-4">
      <p className="text-[13.5px] font-bold">Authorised representatives</p>
      <p className="mt-1 text-[12.5px] text-mute">Representatives can publicly respond to published feedback about this organisation. They cannot edit, hide or close feedback. Confirm their authority (for example an official email domain or a letter) before linking them.</p>
      {!org.verified && <p className="mt-2 rounded-xl bg-sun/15 p-2.5 text-[12.5px]">Verify and publish the organisation before adding representatives.</p>}
      {reps === null ? <Loader2 size={15} className="mt-3 animate-spin" /> : (
        <ul className="mt-3 space-y-1.5">{reps.map((r) => <li key={r.user_id} className="flex items-center gap-2 rounded-xl bg-raised px-3 py-2 text-[13px]"><span className="flex-1">{who(r.user_id)?.display_name || "User"} <span className="text-mute">{who(r.user_id)?.email}</span></span><button onClick={() => remove(r.user_id)} className="focusable rounded-full p-1.5 text-mute hover:text-ruby" aria-label="Remove representative"><Trash2 size={14} /></button></li>)}{!reps.length && <li className="text-[12.5px] text-faint">No representatives yet.</li>}</ul>
      )}
      <div className="mt-3 flex gap-2"><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Representative's account email" aria-label="Representative email" className="flex-1" /><Btn tone="soft" onClick={add} disabled={!org.verified || !email}><UserPlus size={15} />Link</Btn></div>
      {msg && <p className="mt-2 text-[12.5px] text-ruby">{msg}</p>}
    </div>
  );
}
