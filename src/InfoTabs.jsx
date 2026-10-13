import { useEffect, useRef, useState } from "react";
import { Star, AlertTriangle, ThumbsUp, Activity, Landmark, MapPin, ShieldCheck, Languages, Target, Compass, Users, Scale, Lock, Megaphone, Eye, Send, CheckCircle2, Building2, Briefcase, BarChart3, ArrowRight } from "lucide-react";
import { PAGES } from "./pages.js";

const TABS = [["about", "About", "about"], ["what-we-do", "What we do", "what_we_do"], ["how-we-help", "How we help", "how_we_help"]];
const ABOUT_ICONS = [Target, Compass, Users, Scale, Lock];
const WHAT_ICONS = [Star, AlertTriangle, ThumbsUp, Activity, Landmark, MapPin, ShieldCheck, Languages];
const STEP_ICONS = [Megaphone, Users, Eye, Send, CheckCircle2];
const WHO_ICONS = [Users, Building2, Briefcase, BarChart3];
const COLORS = ["#FF7A2F", "#3B3FD8", "#13A86B", "#7C3AED", "#E5484D", "#0E7490", "#B45309", "#D9467F"];
const ico = (list, i) => list[i % list.length];

export default function InfoTabs({ onShare, onExplore }) {
  const hashTab = () => (TABS.find(([h]) => location.hash === `#${h}`) || [])[0];
  const [tab, setTab] = useState(() => hashTab() || "about");
  const ref = useRef(null);
  useEffect(() => {
    const onHash = () => { const t = hashTab(); if (t) { setTab(t); requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" })); } };
    addEventListener("hashchange", onHash); onHash();
    return () => removeEventListener("hashchange", onHash);
  }, []);
  const pick = (t) => { setTab(t); history.replaceState(null, "", `#${t}`); };
  const onKey = (e) => {
    const i = TABS.findIndex(([h]) => h === tab); const n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!n) return; e.preventDefault(); const next = TABS[(i + n + TABS.length) % TABS.length][0]; pick(next); document.getElementById(`tab-${next}`)?.focus();
  };
  const page = PAGES[TABS.find(([h]) => h === tab)[2]];

  return (
    <section ref={ref} aria-labelledby="info-heading" className="scroll-mt-20 border-t hair bg-raised/40">
      {/* Anchors so #about, #what-we-do and #how-we-help all land on this section */}
      {TABS.map(([h]) => <span key={h} id={h} className="block scroll-mt-20" aria-hidden="true" />)}
      <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-6">
        <h2 id="info-heading" className="sr-only">About One Youth One India</h2>
        <div role="tablist" aria-label="About One Youth One India" onKeyDown={onKey} className="no-scrollbar flex max-w-full gap-1 overflow-x-auto rounded-full border hair2 bg-card p-1.5 sm:inline-flex">
          {TABS.map(([h, label]) => (
            <button key={h} id={`tab-${h}`} role="tab" aria-selected={tab === h} aria-controls={`panel-${h}`} tabIndex={tab === h ? 0 : -1} onClick={() => pick(h)}
              className={`focusable flex-1 whitespace-nowrap rounded-full px-4 py-2.5 text-[14px] font-semibold transition sm:flex-none sm:px-5 sm:text-[14.5px] ${tab === h ? "bg-ink text-bg shadow" : "text-mute hover:text-ink"}`}>{label}</button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} tabIndex={0} className="mt-8 focus:outline-none">
          <div className="max-w-3xl">
            <h3 className="font-display text-[34px] font-extrabold leading-[1.05] tracking-[-0.03em] md:text-[46px]">{page.title}</h3>
            <p className="mt-4 text-[16.5px] leading-relaxed text-mute">{page.intro}</p>
          </div>

          {tab === "about" && (
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {page.items.map(([h, t], i) => { const I = ico(ABOUT_ICONS, i); return (
                <article key={h + i} className={`rounded-3xl border hair bg-card p-6 ${i === 0 ? "md:col-span-2 lg:col-span-1 lg:row-span-2 bg-gradient-to-br from-saffron/10 via-card to-indigo/10" : ""}`}>
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: COLORS[i % COLORS.length] }}><I size={20} /></span>
                  <h4 className={`mt-4 font-display font-bold ${i === 0 ? "text-[26px]" : "text-[20px]"}`}>{h}</h4>
                  <p className={`mt-2 leading-relaxed text-mute ${i === 0 ? "text-[16px]" : "text-[14.5px]"}`}>{t}</p>
                </article>); })}
            </div>
          )}

          {tab === "what-we-do" && (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {page.items.map(([h, t], i) => { const I = ico(WHAT_ICONS, i); const c = COLORS[i % COLORS.length]; return (
                <article key={h + i} className="group rounded-3xl border hair bg-card p-6 transition hover:-translate-y-1 hover:shadow-[0_24px_60px_-40px_rgba(59,63,216,0.6)]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: `${c}18`, color: c }}><I size={20} /></span>
                  <h4 className="mt-4 font-display text-[19px] font-bold">{h}</h4>
                  <p className="mt-2 text-[14px] leading-relaxed text-mute">{t}</p>
                </article>); })}
            </div>
          )}

          {tab === "how-we-help" && (
            <>
              <ol className="relative mt-10 grid gap-4 lg:grid-cols-5">
                {page.items.map(([h, t], i) => { const I = ico(STEP_ICONS, i); const c = COLORS[i % COLORS.length]; return (
                  <li key={h + i} className="relative rounded-3xl border hair bg-card p-6">
                    <div className="flex items-center justify-between"><span className="font-display text-[44px] font-extrabold leading-none" style={{ color: `${c}40` }}>{i + 1}</span><span className="flex h-10 w-10 items-center justify-center rounded-2xl text-white" style={{ background: c }}><I size={18} /></span></div>
                    <h4 className="mt-3 font-display text-[18px] font-bold">{h}</h4>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-mute">{t}</p>
                    {i < page.items.length - 1 && <ArrowRight aria-hidden="true" size={18} className="absolute -right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-bg text-faint lg:block" />}
                  </li>); })}
              </ol>
              {page.audiences?.length > 0 && (
                <div className="mt-12">
                  <h4 className="font-display text-[26px] font-bold">Who we help</h4>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {page.audiences.map(([h, t], i) => { const I = ico(WHO_ICONS, i); return (
                      <article key={h + i} className="flex gap-4 rounded-3xl border hair bg-card p-6">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-saffron via-indigo to-leaf text-white"><I size={21} /></span>
                        <div><h5 className="font-display text-[18px] font-bold">{h}</h5><p className="mt-1.5 text-[14px] leading-relaxed text-mute">{t}</p></div>
                      </article>); })}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={onShare} className="focusable inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-bold text-bg"><Megaphone size={18} />Share Your Experience</button>
            <button onClick={onExplore} className="focusable inline-flex h-12 items-center gap-2 rounded-full border hair2 bg-card px-6 text-[15px] font-semibold">Explore feedback<ArrowRight size={17} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
