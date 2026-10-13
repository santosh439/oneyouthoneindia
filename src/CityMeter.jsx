import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gauge as GaugeIcon, MapPin, Search, Trophy, AlertTriangle, ClipboardList, X, Loader2, CheckCircle2, Info, ChevronDown } from "lucide-react";
import { STATES, districtsOf, citiesOf } from "./data.js";
import { DIMS, SCALE, MIN_RESPONSES, band, fetchMeter, myResponses, saveResponse, cityKey } from "./survey.js";

/* Semicircle meter, 0 to 100, with coloured bands and a needle. */
export function Meter({ score, size = 220, label }) {
  const r = 80, cx = 100, cy = 96;
  const pt = (v) => { const a = Math.PI * (1 - v / 100); return [cx + r * Math.cos(a), cy - r * Math.sin(a)]; };
  const arc = (a, b) => { const [x1, y1] = pt(a), [x2, y2] = pt(b); return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`; };
  const [txt, col] = band(score);
  const angle = score == null ? -90 : -90 + Math.max(0, Math.min(100, score)) * 1.8;
  return (
    <figure className="flex flex-col items-center" style={{ width: size }}>
      <svg viewBox="0 0 200 118" width={size} role="img" aria-label={`${label || "City meter"}: ${score == null ? "no data yet" : `${score} out of 100, ${txt}`}`}>
        {[[0, 40, "#E5484D"], [40, 60, "#F5B400"], [60, 75, "#3B3FD8"], [75, 100, "#13A86B"]].map(([a, b, c]) => <path key={a} d={arc(a + 0.6, b - 0.6)} stroke={c} strokeWidth="14" fill="none" strokeLinecap="butt" opacity={score == null ? 0.25 : 0.9} />)}
        {[0, 25, 50, 75, 100].map((v) => { const [x, y] = pt(v); const [x2, y2] = [cx + (x - cx) * 0.78, cy + (y - cy) * 0.78]; return <text key={v} x={x2} y={y2 + 3} textAnchor="middle" fontSize="7" fill="currentColor" opacity=".45">{v}</text>; })}
        <motion.g initial={{ rotate: -90 }} animate={{ rotate: angle }} transition={{ type: "spring", stiffness: 60, damping: 14 }} style={{ originX: `${cx}px`, originY: `${cy}px`, transformBox: "view-box" }}>
          <path d={`M${cx - 3} ${cy} L${cx} ${cy - 66} L${cx + 3} ${cy} Z`} fill="currentColor" />
        </motion.g>
        <circle cx={cx} cy={cy} r="7" fill="currentColor" /><circle cx={cx} cy={cy} r="3" fill={col} />
      </svg>
      <figcaption className="-mt-1 text-center">
        <span className="tab block font-display text-[38px] font-extrabold leading-none">{score == null ? "—" : Math.round(score)}<span className="text-[16px] font-bold text-faint">/100</span></span>
        <span className="mt-1.5 inline-block rounded-full px-3 py-1 text-[12.5px] font-bold" style={{ background: `${col}1A`, color: col }}>{txt}</span>
      </figcaption>
    </figure>
  );
}

function DimBars({ dims, compare }) {
  return (
    <ul className="space-y-3">
      {DIMS.map(([k, l]) => { const v = dims?.[k]; const c = band(v)[1]; const avg = compare?.[k]; return (
        <li key={k}>
          <div className="flex justify-between text-[13px]"><span>{l}</span><span className="tab font-bold" style={{ color: v == null ? undefined : c }}>{v == null ? "—" : Math.round(v)}</span></div>
          <div className="relative mt-1 h-2.5 rounded-full bg-raised">
            {v != null && <motion.div initial={{ width: 0 }} animate={{ width: `${v}%` }} transition={{ duration: 0.7 }} className="h-2.5 rounded-full" style={{ background: c }} />}
            {avg != null && <span title={`All India average ${Math.round(avg)}`} className="absolute -top-1 h-[18px] w-[3px] rounded bg-ink/70" style={{ left: `calc(${avg}% - 1px)` }} />}
          </div>
        </li>); })}
    </ul>
  );
}

export default function CityMeter({ me, signedIn, onSignIn }) {
  const [data, setData] = useState(null);
  const [mine, setMine] = useState([]);
  const [sel, setSel] = useState(null);
  const [q, setQ] = useState("");
  const [stateF, setStateF] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [survey, setSurvey] = useState(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    try { const d = await fetchMeter(); setData(d); setErr(""); } catch (e) { setErr(e.message); setData({ cities: [], india: null }); }
    if (me) myResponses(me).then(setMine).catch(() => {});
  }, [me]);
  useEffect(() => { load(); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  const cities = data?.cities || [];
  useEffect(() => { if (!sel && cities.length) setSel(cities[0]); }, [cities, sel]);
  const filtered = useMemo(() => cities.filter((c) => (stateF === "all" || c.state === stateF) && (!q || `${c.city} ${c.district} ${c.state}`.toLowerCase().includes(q.toLowerCase()))), [cities, q, stateF]);
  const india = data?.india;
  const current = sel && cities.find((c) => cityKey(c.state, c.city) === cityKey(sel.state, sel.city));
  const rank = current ? cities.findIndex((c) => c === current) + 1 : null;
  const top = cities.slice(0, 5), low = [...cities].reverse().slice(0, 5).filter((c) => !top.includes(c) || cities.length > 5);
  const start = (preset) => (signedIn ? setSurvey(preset || {}) : onSignIn());

  return (
    <section id="city-meter" className="scroll-mt-20 border-t hair">
      <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[12.5px] font-bold uppercase tracking-[0.18em] text-saffron">All India City Survey</p>
            <h2 className="mt-2 font-display text-[34px] font-extrabold tracking-[-0.03em] md:text-[44px]">City Meter</h2>
            <p className="mt-2 text-[15.5px] text-mute">How do citizens rate the services in their city? Score your city on eight everyday services and see how it compares across India.</p>
          </div>
          <div className="flex flex-wrap gap-2"><a href="/survey" className="focusable inline-flex h-12 items-center gap-2 rounded-full border hair2 bg-card px-6 text-[15px] font-semibold">Open the full dashboard</a><button onClick={() => start()} className="focusable inline-flex h-12 items-center gap-2 rounded-full bg-ink px-6 text-[15px] font-bold text-bg"><ClipboardList size={18} />Rate your city</button></div>
        </div>
        {err && <p className="mt-6 rounded-2xl bg-ruby/10 p-3 text-[13.5px] text-ruby">{err}</p>}
        {!data ? <p className="mt-10 flex items-center gap-2 text-mute"><Loader2 size={18} className="animate-spin" />Loading the City Meter</p> : (
          <>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {/* All India */}
              <div className="rounded-3xl border hair bg-card p-6">
                <div className="flex items-center gap-2"><span className="text-[22px]" aria-hidden="true">🇮🇳</span><h3 className="font-display text-[22px] font-bold">All India</h3></div>
                <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                  <Meter score={india?.score ?? null} label="All India city meter" />
                  <dl className="grid flex-1 grid-cols-3 gap-2 text-center sm:grid-cols-1 sm:text-left">
                    {[["Responses", india?.responses || 0], ["Cities", india?.cities || 0], ["States and UTs", india?.states || 0]].map(([l, v]) => <div key={l} className="rounded-2xl bg-raised p-3"><dt className="text-[12px] text-mute">{l}</dt><dd className="tab font-display text-[24px] font-extrabold leading-tight">{Number(v).toLocaleString("en-IN")}</dd></div>)}
                  </dl>
                </div>
                <div className="mt-6"><DimBars dims={india?.dims} /></div>
              </div>
              {/* Selected city */}
              <div className="rounded-3xl border hair bg-card p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <MapPin size={20} className="text-indigo" />
                  <h3 className="min-w-0 flex-1 truncate font-display text-[22px] font-bold">{current ? current.city : "Choose a city"}</h3>
                  {current && <span className="rounded-full bg-raised px-3 py-1 text-[12.5px] font-semibold text-mute">Rank {rank} of {cities.length}</span>}
                </div>
                {current && <p className="mt-0.5 text-[13px] text-mute">{[current.district, current.state].filter(Boolean).join(", ")} · {current.responses} responses</p>}
                <div className="relative mt-4"><Search size={16} className="absolute left-3.5 top-3 text-faint" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a city" aria-label="Search a city" className="focusable h-10 w-full rounded-full border hair2 bg-bg pl-10 pr-4 text-[14px] outline-none" />
                  {q && <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-2xl border hair2 bg-card p-1 shadow-2xl">{filtered.slice(0, 12).map((c) => <li key={cityKey(c.state, c.city)}><button onClick={() => { setSel(c); setQ(""); }} className="focusable flex w-full justify-between rounded-xl px-3 py-2 text-left text-[13.5px] hover:bg-raised"><span>{c.city}, {c.state}</span><span className="tab font-bold" style={{ color: band(c.score)[1] }}>{Math.round(c.score)}</span></button></li>)}{!filtered.length && <li className="px-3 py-2 text-[13px] text-mute">Not enough responses yet for that city. <button onClick={() => start({ city: q })} className="font-semibold text-indigo underline">Rate it</button></li>}</ul>}
                </div>
                {current ? (
                  <>
                    <div className="mt-4 flex justify-center"><Meter score={current.score} label={`${current.city} city meter`} /></div>
                    <div className="mt-4"><DimBars dims={current.dims} compare={india?.dims} /></div>
                    <p className="mt-3 flex items-center gap-1.5 text-[12px] text-faint"><span className="inline-block h-3 w-[3px] rounded bg-ink/70" />All India average</p>
                    <button onClick={() => start({ state: current.state, district: current.district, city: current.city })} className="focusable mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-indigo px-5 text-[14px] font-bold text-white">{mine.some((m) => m.city_key === cityKey(current.state, current.city)) ? "Update my rating" : `Rate ${current.city}`}</button>
                  </>
                ) : <div className="mt-8 rounded-2xl border border-dashed hair2 p-8 text-center text-[14px] text-mute"><GaugeIcon className="mx-auto mb-2 text-faint" />No city has {MIN_RESPONSES} responses yet. Be among the first to rate your city.</div>}
              </div>
            </div>

            {/* Rankings graph */}
            {cities.length > 0 && (
              <div className="mt-5 rounded-3xl border hair bg-card p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="flex-1 font-display text-[22px] font-bold">City rankings</h3>
                  <select value={stateF} onChange={(e) => setStateF(e.target.value)} aria-label="Filter by state" className="focusable h-10 rounded-full border hair2 bg-bg px-3 text-[13.5px]"><option value="all">All states</option>{[...new Set(cities.map((c) => c.state))].sort().map((s) => <option key={s}>{s}</option>)}</select>
                </div>
                {stateF === "all" && cities.length > 5 && (
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {[[Trophy, "Top rated", top, "#13A86B"], [AlertTriangle, "Needs most attention", low, "#E5484D"]].map(([I, t, list, c]) => (
                      <div key={t} className="rounded-2xl bg-raised/70 p-4"><p className="mb-2 flex items-center gap-2 text-[13.5px] font-bold" style={{ color: c }}><I size={16} />{t}</p>
                        <ol className="space-y-1.5">{list.map((x) => <li key={cityKey(x.state, x.city)}><button onClick={() => setSel(x)} className="focusable flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-[13.5px] hover:bg-card"><span className="tab w-6 text-faint">{cities.indexOf(x) + 1}</span><span className="flex-1 truncate font-semibold">{x.city}<span className="font-normal text-mute">, {x.state}</span></span><span className="tab font-bold" style={{ color: band(x.score)[1] }}>{Math.round(x.score)}</span></button></li>)}</ol></div>
                    ))}
                  </div>
                )}
                <ul className="mt-5 space-y-2.5" aria-label="City scores">
                  {(showAll ? filtered : filtered.slice(0, 10)).map((c) => { const [, col] = band(c.score); const active = current === c; return (
                    <li key={cityKey(c.state, c.city)}>
                      <button onClick={() => { setSel(c); document.getElementById("city-meter")?.scrollIntoView({ behavior: "smooth" }); }} className={`focusable grid w-full grid-cols-[minmax(110px,190px)_1fr_auto] items-center gap-3 rounded-xl px-2 py-1 text-left hover:bg-raised ${active ? "bg-raised" : ""}`}>
                        <span className="truncate text-[13.5px] font-semibold">{c.city}<span className="block truncate text-[11.5px] font-normal text-faint">{c.state} · {c.responses} responses</span></span>
                        <span className="relative h-3 rounded-full bg-line/10"><motion.span initial={{ width: 0 }} animate={{ width: `${c.score}%` }} transition={{ duration: 0.8 }} className="absolute inset-y-0 left-0 rounded-full" style={{ background: col }} />{india?.score != null && <span className="absolute -top-1 h-5 w-[2px] bg-ink/40" style={{ left: `${india.score}%` }} />}</span>
                        <span className="tab w-10 text-right font-display text-[16px] font-extrabold" style={{ color: col }}>{Math.round(c.score)}</span>
                      </button>
                    </li>); })}
                </ul>
                {filtered.length > 10 && <button onClick={() => setShowAll(!showAll)} className="focusable mt-4 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13.5px] font-semibold text-indigo hover:bg-raised">{showAll ? "Show top 10" : `Show all ${filtered.length} cities`}<ChevronDown size={15} className={showAll ? "rotate-180" : ""} /></button>}
              </div>
            )}
            <p className="mt-4 flex items-start gap-2 text-[12.5px] text-faint"><Info size={14} className="mt-0.5 shrink-0" />Scores reflect ratings given by people on One Youth One India and are not an official statistic. A city appears once at least {MIN_RESPONSES} people have rated it. Individual answers are never shown. 0 to 100 = average rating from Very poor to Excellent.</p>
          </>
        )}
      </div>
      <AnimatePresence>{survey && <SurveySheet me={me} preset={survey} mine={mine} onClose={() => setSurvey(null)} onSaved={(row) => { load(); setSel({ state: row.state, city: row.city }); }} />}</AnimatePresence>
    </section>
  );
}

export function SurveySheet({ me, preset, mine, onClose, onSaved }) {
  const [f, setF] = useState({ state: preset.state || "", district: preset.district || "", city: preset.city || "", scores: {} });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(null);
  const existing = f.state && f.city.trim() ? mine.find((m) => m.city_key === cityKey(f.state, f.city)) : null;
  useEffect(() => { if (existing) setF((x) => ({ ...x, scores: existing.scores, district: x.district || existing.district || "" })); }, [existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  const answered = DIMS.filter(([k]) => f.scores[k]).length;
  const submit = async () => {
    if (!f.state || !f.city.trim()) return setErr("Choose your state and city.");
    if (answered < 5) return setErr("Please rate at least 5 of the 8 services.");
    setBusy(true); setErr("");
    try { const row = await saveResponse(me, existing, f); setDone(row); onSaved(row); } catch (e) { setErr(/duplicate|unique/i.test(e.message) ? "You have already rated this city. Reopen it to update your rating." : e.message); }
    setBusy(false);
  };
  const sel = "focusable h-11 w-full rounded-xl border hair2 bg-bg px-3 text-[14px]";
  return (
    <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div role="dialog" aria-modal="true" aria-label="Rate your city" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onMouseDown={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-card sm:rounded-3xl">
        <header className="flex items-center justify-between border-b hair px-6 py-4"><h2 className="font-display text-[22px] font-bold">{done ? "Thank you" : existing ? "Update your city rating" : "Rate your city"}</h2><button onClick={onClose} className="focusable rounded-full p-2 text-mute" aria-label="Close"><X size={20} /></button></header>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {done ? (
            <div className="py-6 text-center"><CheckCircle2 size={44} className="mx-auto text-leaf" /><p className="mt-3 font-display text-[22px] font-bold">Your rating for {done.city} is saved</p><p className="mx-auto mt-2 max-w-sm text-[14px] text-mute">It counts towards the City Meter right away. {done.city} appears in the rankings once {MIN_RESPONSES} people have rated it. You can update your rating any time.</p></div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-[13px] font-semibold">State or union territory<select className={`${sel} mt-1.5`} value={f.state} onChange={(e) => setF({ ...f, state: e.target.value, district: "", city: "" })}><option value="">Choose</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
                <label className="text-[13px] font-semibold">District<select className={`${sel} mt-1.5`} value={f.district} onChange={(e) => setF({ ...f, district: e.target.value })} disabled={!f.state}><option value="">Choose</option>{districtsOf(f.state).map((d) => <option key={d.name}>{d.name}</option>)}</select></label>
                <label className="text-[13px] font-semibold sm:col-span-2">City or town<input list="cm-cities" className={`${sel} mt-1.5`} value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="e.g. Bengaluru" disabled={!f.state} maxLength={80} /><datalist id="cm-cities">{citiesOf(f.state).map((c) => <option key={c} value={c} />)}</datalist></label>
              </div>
              {existing && <p className="rounded-2xl bg-indigo/10 p-3 text-[13px] text-indigo">You rated {existing.city} before. Your earlier answers are filled in; change anything and save to update.</p>}
              <fieldset>
                <legend className="text-[14px] font-bold">How would you rate these services in your city? <span className="font-normal text-mute">({answered}/8)</span></legend>
                <div className="mt-3 space-y-3">
                  {DIMS.map(([k, l]) => (
                    <div key={k} className="rounded-2xl bg-raised/70 p-3">
                      <p className="text-[13.5px] font-semibold" id={`d-${k}`}>{l}</p>
                      <div role="radiogroup" aria-labelledby={`d-${k}`} className="mt-2 grid grid-cols-5 gap-1.5">
                        {SCALE.map(([v, t]) => { const on = f.scores[k] === v; const c = band((v - 1) * 25)[1]; return (
                          <button key={v} type="button" role="radio" aria-checked={on} onClick={() => setF({ ...f, scores: { ...f.scores, [k]: v } })}
                            className={`focusable rounded-xl border px-1 py-2 text-[11.5px] font-semibold leading-tight transition ${on ? "border-transparent text-white" : "hair2 bg-card text-mute hover:text-ink"}`} style={on ? { background: c } : undefined}>
                            <span className="block font-display text-[15px] font-extrabold">{v}</span>{t}
                          </button>); })}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>
              <p className="flex items-start gap-2 text-[12.5px] text-faint"><Info size={14} className="mt-0.5 shrink-0" />Your individual answers are private. Only city averages are shown, and only once {MIN_RESPONSES} or more people have rated a city.</p>
              {err && <p className="rounded-xl bg-ruby/10 p-3 text-[13px] text-ruby">{err}</p>}
            </div>
          )}
        </div>
        <footer className="flex items-center justify-end gap-2 border-t hair px-6 py-4">
          {done ? <button onClick={onClose} className="focusable h-11 rounded-full bg-ink px-6 text-[14.5px] font-bold text-bg">Done</button> : <button onClick={submit} disabled={busy} className="focusable inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[14.5px] font-bold text-bg disabled:opacity-60">{busy && <Loader2 size={16} className="animate-spin" />}{existing ? "Update rating" : "Submit rating"}</button>}
        </footer>
      </motion.div>
    </motion.div>
  );
}
