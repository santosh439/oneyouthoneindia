import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, Landmark, Building2, Scale, MapPin, Sparkles, Copy, Check, BadgeCheck, Info, X, ShieldAlert, Globe2 } from "lucide-react";
import { Shell } from "./portal/ui.jsx";
import { CONTACT } from "./data.js";
import { START, SERVICES, BODIES, MINISTRIES, STATE_PORTALS, SECTORS, DISTRICTS_URL, CHECKED_ON, allLinks } from "./directory.js";

const host = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const initials = (n) => n.replace(/^(Department of|Ministry of)\s+/i, "").split(/[\s,()]+/).filter((w) => w.length > 2 && !/^(and|the|of)$/i.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
const PALETTE = ["#FF7A2F", "#3B3FD8", "#13A86B", "#7C3AED", "#0E7490", "#D9467F", "#B45309", "#E5484D"];
const color = (s) => PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];

function CopyBtn({ url }) {
  const [ok, setOk] = useState(false);
  return <button onClick={async (e) => { e.preventDefault(); e.stopPropagation(); try { await navigator.clipboard.writeText(url); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* clipboard unavailable */ } }} aria-label={`Copy link ${host(url)}`} className="focusable rounded-full p-1.5 text-faint hover:bg-raised hover:text-ink">{ok ? <Check size={14} className="text-leaf" /> : <Copy size={14} />}</button>;
}
const Tick = ({ ok }) => ok ? <BadgeCheck size={14} className="shrink-0 text-leaf" aria-label={`Address checked ${CHECKED_ON}`}><title>{`Address checked ${CHECKED_ON}`}</title></BadgeCheck> : null;

function LinkRow({ l, sub }) {
  return (
    <a href={l.url} target="_blank" rel="noopener noreferrer" className="focusable group flex items-center gap-3 rounded-2xl border hair2 bg-card p-3.5 transition hover:-translate-y-0.5 hover:shadow-lg">
      <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="line-clamp-2 text-[14px] font-bold leading-snug">{l.name}</span><Tick ok={l.ok} /></span>{(sub || l.note) && <span className="block truncate text-[12px] text-mute">{sub || l.note}</span>}<span className="block truncate font-mono text-[11.5px] text-indigo">{host(l.url)}</span></span>
      <CopyBtn url={l.url} /><ExternalLink size={15} className="shrink-0 text-faint group-hover:text-indigo" />
    </a>
  );
}

export default function DirectoryPage() {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [tab, setTab] = useState("all");
  const box = useRef(null);
  useEffect(() => { const k = (e) => { if (e.key === "/" && document.activeElement?.tagName !== "INPUT") { e.preventDefault(); box.current?.focus(); } }; addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, []);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const match = (...t) => !words.length || words.every((w) => t.join(" ").toLowerCase().includes(w));
  const ministries = useMemo(() => MINISTRIES.filter((m) => (sector === "all" || m.sector === sector) && match(m.name, m.sector, m.url, ...m.departments.map((d) => d.name))), [q, sector]); // eslint-disable-line react-hooks/exhaustive-deps
  const states = STATE_PORTALS.filter((s) => match(s.name, s.code, s.url, s.type === "ut" ? "union territory ut" : "state"));
  const services = SERVICES.filter((s) => match(s.name, s.tag, s.note || "", s.url));
  const bodies = BODIES.filter((b) => match(b.name, b.kind, b.url));
  const start = START.filter((s) => match(s.name, s.note || "", s.url));
  const total = allLinks().length, checked = allLinks().filter((l) => l.ok).length, depts = MINISTRIES.reduce((a, m) => a + m.departments.length, 0);
  const show = (k) => tab === "all" || tab === k;
  const none = !ministries.length && !states.length && !services.length && !bodies.length && !start.length;
  const TABS = [["all", "Everything", Globe2], ["services", "Citizen services", Sparkles], ["ministries", "Ministries", Building2], ["states", "States and UTs", MapPin], ["bodies", "Commissions and regulators", Scale]];

  return (
    <Shell title="Government websites">
      <section className="relative overflow-hidden rounded-[28px] bg-[#16152B] p-6 text-white md:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-indigo/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-saffron/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-1/4 h-48 w-48 rounded-full bg-leaf/25 blur-3xl" />
        <div className="relative">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-semibold"><Landmark size={14} />Official directory · links checked every week</span>
          <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.03] tracking-[-0.035em] md:text-[54px]">Every Government of India<br /><span className="bg-gradient-to-r from-saffron via-[#8B8FFF] to-leaf bg-clip-text text-transparent">website, in one place</span></h1>
          <p className="mt-3 max-w-2xl text-[15.5px] text-white/70">Union ministries and departments, citizen service portals, commissions and regulators, and the official portal of every State and Union Territory. Only official government addresses.</p>
          <div className="relative mt-6 max-w-2xl">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/50" />
            <input ref={box} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: passport, pension, Karnataka, railways, grievance…" aria-label="Search government websites"
              className="h-14 w-full rounded-2xl border border-white/15 bg-white/10 pl-14 pr-24 text-[16px] text-white outline-none backdrop-blur placeholder:text-white/40 focus:border-white/40" />
            {q ? <button onClick={() => setQ("")} aria-label="Clear search" className="focusable absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-white/60 hover:bg-white/10"><X size={18} /></button>
              : <kbd className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-white/20 px-2 py-0.5 text-[12px] text-white/50 sm:block">/</kbd>}
          </div>
          <div className="mt-6 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[[MINISTRIES.length, "Ministries"], [depts, "Departments"], [STATE_PORTALS.length, "States and UTs"], [total, "Official links"]].map(([v, l]) => <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5"><p className="tab font-display text-[26px] font-extrabold leading-none">{v}</p><p className="mt-1 text-[12px] text-white/60">{l}</p></div>)}
          </div>
        </div>
      </section>

      <div role="tablist" aria-label="Directory sections" className="no-scrollbar -mx-4 mt-6 flex gap-1.5 overflow-x-auto px-4">
        {TABS.map(([k, l, I]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`focusable inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-[14px] font-semibold ${tab === k ? "bg-ink text-bg" : "bg-raised text-mute hover:text-ink"}`}><I size={16} />{l}</button>)}
      </div>

      {none && <p className="mt-10 rounded-3xl border border-dashed hair2 p-10 text-center text-[14.5px] text-mute">Nothing matches “{q}”. Try a simpler word, or search the <a className="font-semibold text-indigo underline" href="https://igod.gov.in" target="_blank" rel="noopener noreferrer">official NIC directory</a>.</p>}

      {show("all") && start.length > 0 && (
        <section className="mt-6"><h2 className="mb-3 font-display text-[22px] font-bold">Start here</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{start.map((l) => <LinkRow key={l.url} l={l} />)}</div></section>
      )}

      {show("services") && services.length > 0 && (
        <section className="mt-8"><h2 className="font-display text-[22px] font-bold">Citizen services</h2><p className="mb-3 text-[13px] text-mute">Do it yourself online: complaints, identity documents, money, work and benefits.</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{services.map((l) => <LinkRow key={l.url} l={l} sub={`${l.tag}${l.note ? ` · ${l.note}` : ""}`} />)}</div></section>
      )}

      {show("ministries") && ministries.length > 0 && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-[22px] font-bold">Union ministries and departments</h2><p className="text-[13px] text-mute">{ministries.length} of {MINISTRIES.length} shown{sector !== "all" ? ` in ${sector}` : ""}</p></div>
            <select value={sector} onChange={(e) => setSector(e.target.value)} aria-label="Filter by sector" className="focusable h-10 rounded-full border hair2 bg-card px-3 text-[13.5px]"><option value="all">All sectors</option>{SECTORS.map((s) => <option key={s}>{s}</option>)}</select></div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {ministries.map((m, i) => { const c = color(m.name); return (
              <motion.article key={m.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 12) * 0.02 }} className="flex flex-col rounded-3xl border hair bg-card p-4">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="focusable group flex items-start gap-3 rounded-2xl">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl font-display text-[14px] font-extrabold text-white" style={{ background: `linear-gradient(135deg, ${c}, ${c}AA)` }}>{initials(m.name)}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-start gap-1.5"><span className="text-[14.5px] font-bold leading-snug group-hover:text-indigo">{/^Department/.test(m.name) ? m.name : `Ministry of ${m.name}`}</span><Tick ok={m.ok} /></span><span className="block font-mono text-[11.5px] text-indigo">{host(m.url)}</span></span>
                  <ExternalLink size={15} className="mt-1 shrink-0 text-faint group-hover:text-indigo" />
                </a>
                <span className="mt-2 w-fit rounded-full bg-raised px-2.5 py-0.5 text-[11px] font-semibold text-mute">{m.sector}</span>
                {m.departments.length > 0 && <ul className="mt-3 space-y-1 border-t hair pt-2">{m.departments.map((d) => <li key={d.url}><a href={d.url} target="_blank" rel="noopener noreferrer" className="focusable flex items-center gap-2 rounded-lg px-1.5 py-1 text-[12.5px] hover:bg-raised"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c }} /><span className="min-w-0 flex-1 truncate">Department of {d.name}</span><Tick ok={d.ok} /><ExternalLink size={12} className="shrink-0 text-faint" /></a></li>)}</ul>}
              </motion.article>); })}
          </div>
        </section>
      )}

      {show("states") && states.length > 0 && (
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-display text-[22px] font-bold">State and Union Territory portals</h2><p className="text-[13px] text-mute">Official portal of each government. For district websites use the <a href={DISTRICTS_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo hover:underline">NIC district directory</a>.</p></div></div>
          {[["state", "States"], ["ut", "Union Territories"]].map(([t, label]) => { const list = states.filter((s) => s.type === t); return list.length > 0 && (
            <div key={t} className="mt-4"><p className="mb-2 text-[12px] font-bold uppercase tracking-[0.15em] text-faint">{label} ({list.length})</p>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{list.map((s) => (
                <a key={s.code} href={s.url} target="_blank" rel="noopener noreferrer" className="focusable group flex items-center gap-3 rounded-2xl border hair2 bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-extrabold text-white" style={{ background: t === "ut" ? "#7C3AED" : "#3B3FD8" }}>{s.code}</span>
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-1.5"><span className="truncate text-[13.5px] font-bold">{s.name}</span><Tick ok={s.ok} /></span><span className="block truncate font-mono text-[11px] text-indigo">{host(s.url)}</span></span>
                  <ExternalLink size={14} className="shrink-0 text-faint group-hover:text-indigo" />
                </a>))}</div></div>); })}
        </section>
      )}

      {show("bodies") && bodies.length > 0 && (
        <section className="mt-8"><h2 className="font-display text-[22px] font-bold">Commissions, constitutional bodies and regulators</h2><p className="mb-3 text-[13px] text-mute">Independent bodies you can approach for elections, audits, information, vigilance, rights and regulated sectors.</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{bodies.map((l) => <LinkRow key={l.url} l={l} sub={l.kind} />)}</div></section>
      )}

      <section className="mt-10 grid gap-4 rounded-3xl bg-raised p-6 text-[13px] text-mute md:grid-cols-3">
        <div><p className="flex items-center gap-1.5 font-bold text-ink"><BadgeCheck size={15} className="text-leaf" />How addresses are checked</p><p className="mt-1">Addresses come from the NIC government directory (igod.gov.in), official State listings and the organisations' own websites. {checked} of {total} were checked by hand on {CHECKED_ON} (green tick), and every link is tested automatically each week.</p></div>
        <div><p className="flex items-center gap-1.5 font-bold text-ink"><ShieldAlert size={15} className="text-saffron" />Stay safe</p><p className="mt-1">Official sites end in gov.in or nic.in (a few use mygov.in, sansad.in or rbi.org.in). Government sites never ask for your OTP or PIN by phone. Be careful with look-alike addresses.</p></div>
        <div><p className="flex items-center gap-1.5 font-bold text-ink"><Info size={15} />Found a broken link?</p><p className="mt-1">Departments sometimes move their websites. <a href={`mailto:${CONTACT.email}?subject=${encodeURIComponent("Broken government link")}`} className="font-semibold text-indigo hover:underline">Tell us</a> and we will update it.</p></div>
      </section>
    </Shell>
  );
}
