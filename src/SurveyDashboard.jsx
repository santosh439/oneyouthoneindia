import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Users, MapPin, Map, Trophy, AlertTriangle, TrendingUp, Sparkles, Search, Info, Download, Loader2, X, Building2 } from "lucide-react";
import { Shell } from "./portal/ui.jsx";
import { session } from "./portal/api.js";
import { DIMS, MIN_RESPONSES, BANDS, band, fetchDashboard, myResponses, cityKey, TILES, tileKey } from "./survey.js";
import { Meter, SurveySheet } from "./CityMeter.jsx";

const SHORT = { roads: "Roads", water: "Water", power: "Electricity", cleanliness: "Cleanliness", safety: "Safety", transport: "Transport", health: "Healthcare", education: "Education" };
const r0 = (v) => (v == null ? "—" : Math.round(v));
const fmtN = (n) => Number(n || 0).toLocaleString("en-IN");

export default function SurveyDashboard() {
  const [d, setD] = useState(null);
  const [me, setMe] = useState(null);
  const [mine, setMine] = useState([]);
  const [sel, setSel] = useState(null); // { type: "state" | "city", key }
  const [survey, setSurvey] = useState(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    try { setD(await fetchDashboard()); setErr(""); } catch (e) { setErr(e.message); setD({ cities: [], states: [], india: null, trend: [] }); }
  }, []);
  useEffect(() => { load(); session().then((s) => { setMe(s); if (s.user) myResponses(s.user.id).then(setMine).catch(() => {}); }).catch(() => setMe({ user: null })); const t = setInterval(load, 60000); return () => clearInterval(t); }, [load]);
  const rate = (preset = {}) => (me?.user ? setSurvey(preset) : (location.href = "/?signin=1"));

  if (!d) return <Shell title="City survey"><p className="flex items-center gap-2 py-20 text-mute"><Loader2 className="animate-spin" size={18} />Loading the All India City Survey</p></Shell>;
  const { cities, states, india, trend } = d;
  const stateBy = Object.fromEntries(states.map((s) => [tileKey(s.state), s]));
  const focus = sel?.type === "state" ? stateBy[sel.key] : sel?.type === "city" ? cities.find((c) => cityKey(c.state, c.city) === sel.key) : null;

  return (
    <Shell title="City survey">
      {err && <p className="mb-4 rounded-2xl bg-ruby/10 p-3 text-[13.5px] text-ruby">{err}</p>}
      <Hero india={india} cities={cities} states={states} trend={trend} onRate={() => rate()} />
      <Insights india={india} cities={cities} states={states} onPick={setSel} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <TileMap stateBy={stateBy} sel={sel} onPick={(k) => setSel({ type: "state", key: k })} />
        <Focus focus={focus} sel={sel} india={india} cities={cities} onClear={() => setSel(null)} onPickCity={(c) => setSel({ type: "city", key: cityKey(c.state, c.city) })} onRate={rate} mine={mine} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <Services india={india} focus={focus} sel={sel} />
        <Trend trend={trend} />
      </div>
      <Heatmap cities={cities} onPick={(c) => setSel({ type: "city", key: cityKey(c.state, c.city) })} />
      <Leaderboard cities={cities} india={india} onPick={(c) => { setSel({ type: "city", key: cityKey(c.state, c.city) }); window.scrollTo({ top: 600, behavior: "smooth" }); }} />
      <Method />
      <AnimatePresence>{survey && me?.user && <SurveySheet me={me.user.id} preset={survey} mine={mine} onClose={() => setSurvey(null)} onSaved={() => { load(); myResponses(me.user.id).then(setMine); }} />}</AnimatePresence>
    </Shell>
  );
}

/* ---------- Hero ---------- */
function Hero({ india, cities, states, trend, onRate }) {
  const last = trend.at(-1), prev = trend.at(-2);
  const delta = last && prev && last.score != null && prev.score != null ? Math.round(last.score - prev.score) : null;
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-[#16152B] p-6 text-white md:p-10">
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo/40 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-saffron/30 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/3 h-56 w-56 rounded-full bg-leaf/20 blur-3xl" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-semibold tracking-wide"><span className="h-2 w-2 animate-pulse rounded-full bg-leaf" />Live results · updates every minute</span>
          <h1 className="mt-4 font-display text-[36px] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[56px]">All India<br /><span className="bg-gradient-to-r from-saffron via-[#8B8FFF] to-leaf bg-clip-text text-transparent">City Survey</span></h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-white/70">How citizens rate everyday services in their city: roads, water, electricity, cleanliness, safety, transport, healthcare and education. One national picture, built from people's own ratings.</p>
          <div className="mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[[Users, "Responses", fmtN(india?.responses)], [Building2, "Cities rated", fmtN(india?.cities)], [MapPin, "States and UTs", fmtN(india?.states)], [Map, "On the map", `${states.length}/36`]].map(([I, l, v]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur"><I size={16} className="text-white/60" /><p className="tab mt-2 font-display text-[24px] font-extrabold leading-none">{v}</p><p className="mt-1 text-[11.5px] text-white/60">{l}</p></div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={onRate} className="focusable inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-bold text-[#16152B]"><ClipboardList size={18} />Rate your city</button>
            <a href="#leaderboard" className="focusable inline-flex h-12 items-center gap-2 rounded-full border border-white/20 px-6 text-[15px] font-semibold text-white">See all {cities.length} cities</a>
          </div>
        </div>
        <div className="flex flex-col items-center rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-white backdrop-blur">
          <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/60">National City Score</p>
          <div className="mt-2"><Meter score={india?.score ?? null} size={250} label="National city score" /></div>
          {delta != null && <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold ${delta >= 0 ? "bg-leaf/20 text-[#5BE3A6]" : "bg-ruby/20 text-[#FF8A8D]"}`}><TrendingUp size={14} className={delta < 0 ? "rotate-180" : ""} />{delta >= 0 ? "+" : ""}{delta} vs previous week</p>}
          <p className="mt-3 text-center text-[12px] text-white/50">0 = every service Very poor · 100 = every service Excellent</p>
        </div>
      </div>
    </section>
  );
}

/* ---------- Insights ---------- */
function Insights({ india, cities, states, onPick }) {
  const dims = DIMS.map(([k]) => [k, india?.dims?.[k]]).filter(([, v]) => v != null).sort((a, b) => b[1] - a[1]);
  if (!dims.length) return null;
  const spread = DIMS.map(([k]) => { const vals = cities.map((c) => c.dims?.[k]).filter((v) => v != null); return [k, vals.length > 1 ? Math.max(...vals) - Math.min(...vals) : 0]; }).sort((a, b) => b[1] - a[1])[0];
  const topCity = cities[0], topState = states[0];
  const cards = [
    [Trophy, "Strongest service nationally", SHORT[dims[0][0]], `${r0(dims[0][1])}/100`, "#13A86B"],
    [AlertTriangle, "Weakest service nationally", SHORT[dims.at(-1)[0]], `${r0(dims.at(-1)[1])}/100`, "#E5484D"],
    topCity && [Sparkles, "Highest rated city", topCity.city, `${r0(topCity.score)} · ${topCity.state}`, "#3B3FD8", () => onPick({ type: "city", key: cityKey(topCity.state, topCity.city) })],
    topState && [MapPin, "Leading State or UT", topState.state, `${r0(topState.score)} · ${topState.responses} responses`, "#FF7A2F", () => onPick({ type: "state", key: tileKey(topState.state) })],
    spread && spread[1] > 0 && [TrendingUp, "Widest gap between cities", SHORT[spread[0]], `${r0(spread[1])} points apart`, "#7C3AED"],
  ].filter(Boolean);
  return (
    <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Key insights">
      {cards.map(([I, l, v, s, c, fn]) => (
        <button key={l} onClick={fn} disabled={!fn} className={`focusable relative overflow-hidden rounded-3xl border hair bg-card p-5 text-left ${fn ? "transition hover:-translate-y-0.5" : "cursor-default"}`}>
          <span aria-hidden="true" className="absolute right-0 top-0 h-full w-1.5" style={{ background: c }} />
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${c}18`, color: c }}><I size={17} /></span>
          <p className="mt-3 text-[12px] font-semibold text-mute">{l}</p>
          <p className="mt-0.5 font-display text-[20px] font-extrabold leading-tight">{v}</p>
          <p className="mt-1 text-[12.5px] text-faint">{s}</p>
        </button>
      ))}
    </section>
  );
}

/* ---------- India tile map ---------- */
function TileMap({ stateBy, sel, onPick }) {
  const [hover, setHover] = useState(null);
  const W = 10, Hh = 9, S = 58;
  return (
    <section className="rounded-3xl border hair bg-card p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-display text-[22px] font-bold">State and UT scores</h2><p className="text-[13px] text-mute">Each tile is one State or UT, placed roughly by geography. Select a tile to explore.</p></div>
        <ul className="flex flex-wrap gap-2 text-[11.5px]">{[...BANDS].reverse().map(([m, l, c]) => <li key={l} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: c }} />{l}</li>)}<li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-line/15" />Fewer than {MIN_RESPONSES} responses</li></ul>
      </div>
      <div className="relative mt-4 overflow-x-auto">
        <svg viewBox={`0 0 ${W * S} ${Hh * S}`} className="mx-auto w-full min-w-[460px] max-w-[620px]" role="group" aria-label="Map of States and Union Territories by score">
          {TILES.map(([code, name, x, y]) => {
            const st = stateBy[tileKey(name)]; const [txt, col] = band(st?.score); const on = sel?.type === "state" && sel.key === tileKey(name);
            return (
              <g key={code} transform={`translate(${x * S + 3},${y * S + 3})`} onMouseEnter={() => setHover({ name, st, txt })} onMouseLeave={() => setHover(null)} onClick={() => st && onPick(tileKey(name))}
                role="button" tabIndex={st ? 0 : -1} aria-label={`${name}: ${st ? `${r0(st.score)} out of 100, ${txt}` : "not enough responses yet"}`} onKeyDown={(e) => { if (st && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onPick(tileKey(name)); } }}
                style={{ cursor: st ? "pointer" : "default", outline: "none" }}>
                <motion.rect width={S - 6} height={S - 6} rx="12" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (x + y) * 0.03 }}
                  fill={st ? col : "rgb(var(--line) / 0.1)"} stroke={on ? "rgb(var(--ink))" : "transparent"} strokeWidth="3" />
                <text x={(S - 6) / 2} y={st ? 21 : 30} textAnchor="middle" fontSize="13" fontWeight="800" fill={st ? "#fff" : "currentColor"} opacity={st ? 1 : 0.45}>{code}</text>
                {st && <text x={(S - 6) / 2} y="39" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" opacity=".9">{r0(st.score)}</text>}
              </g>
            );
          })}
        </svg>
        {hover && <div className="pointer-events-none absolute left-3 top-3 rounded-2xl border hair2 bg-card px-4 py-3 text-[13px] shadow-xl"><p className="font-bold">{hover.name}</p><p className="text-mute">{hover.st ? `${r0(hover.st.score)}/100 · ${hover.txt} · ${hover.st.responses} responses` : `Fewer than ${MIN_RESPONSES} responses so far`}</p></div>}
      </div>
      <p className="mt-2 text-[11.5px] text-faint">Schematic tile map, not to scale and not a depiction of boundaries.</p>
    </section>
  );
}

/* ---------- Focus panel (State or city) ---------- */
function Focus({ focus, sel, india, cities, onClear, onPickCity, onRate, mine }) {
  if (!focus) return (
    <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed hair2 bg-card p-8 text-center">
      <Map size={30} className="text-faint" /><p className="mt-3 font-display text-[19px] font-bold">Pick a State, UT or city</p><p className="mt-1 max-w-sm text-[13.5px] text-mute">Select a coloured tile on the map, or a city in the rankings, to see its score for every service compared with the national average.</p>
    </section>
  );
  const isState = sel.type === "state";
  const title = isState ? focus.state : focus.city;
  const sub = isState ? `${focus.responses} responses · ${focus.cities} cities` : `${[focus.district, focus.state].filter(Boolean).join(", ")} · ${focus.responses} responses`;
  const its = isState ? cities.filter((c) => tileKey(c.state) === tileKey(focus.state)) : [];
  const rank = !isState ? cities.indexOf(focus) + 1 : null;
  const rated = !isState && mine.some((m) => m.city_key === cityKey(focus.state, focus.city));
  return (
    <section className="rounded-3xl border hair bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1"><p className="text-[12px] font-bold uppercase tracking-[0.15em] text-faint">{isState ? "State / UT" : `City · rank ${rank} of ${cities.length}`}</p><h2 className="truncate font-display text-[26px] font-extrabold leading-tight">{title}</h2><p className="text-[13px] text-mute">{sub}</p></div>
        <button onClick={onClear} className="focusable rounded-full p-2 text-mute hover:bg-raised" aria-label="Clear selection"><X size={18} /></button>
      </div>
      <div className="mt-2 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
        <Meter score={focus.score} size={200} label={`${title} score`} />
        <ul className="space-y-2.5">
          {DIMS.map(([k]) => { const v = focus.dims?.[k], a = india?.dims?.[k]; const diff = v != null && a != null ? Math.round(v - a) : null; return (
            <li key={k} className="grid grid-cols-[90px_1fr_44px] items-center gap-2 text-[12.5px]">
              <span className="truncate">{SHORT[k]}</span>
              <span className="relative h-2.5 rounded-full bg-line/10">{v != null && <motion.span initial={{ width: 0 }} animate={{ width: `${v}%` }} className="absolute inset-y-0 left-0 rounded-full" style={{ background: band(v)[1] }} />}{a != null && <span className="absolute -top-1 h-[18px] w-[2px] rounded bg-ink/60" style={{ left: `${a}%` }} />}</span>
              <span className={`tab text-right font-bold ${diff == null ? "text-faint" : diff >= 0 ? "text-leaf" : "text-ruby"}`}>{diff == null ? "—" : `${diff >= 0 ? "+" : ""}${diff}`}</span>
            </li>); })}
        </ul>
      </div>
      <p className="mt-2 text-[11.5px] text-faint">Bar = score · marker = national average · number = difference from national average</p>
      {isState && its.length > 0 && <div className="mt-4"><p className="text-[13px] font-bold">Cities in {title}</p><div className="mt-2 flex flex-wrap gap-1.5">{its.map((c) => <button key={c.city} onClick={() => onPickCity(c)} className="focusable rounded-full border hair2 px-3 py-1.5 text-[12.5px] font-semibold hover:bg-raised">{c.city} <span style={{ color: band(c.score)[1] }}>{r0(c.score)}</span></button>)}</div></div>}
      {!isState && <button onClick={() => onRate({ state: focus.state, district: focus.district, city: focus.city })} className="focusable mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-indigo px-5 text-[14px] font-bold text-white">{rated ? "Update my rating" : `Rate ${focus.city}`}</button>}
    </section>
  );
}

/* ---------- Services radar ---------- */
function Services({ india, focus, sel }) {
  const n = DIMS.length, R = 110, C = 150;
  const pt = (i, v) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; const r = (R * (v ?? 0)) / 100; return [C + r * Math.cos(a), C + r * Math.sin(a)]; };
  const poly = (dims) => DIMS.map(([k], i) => pt(i, dims?.[k]).join(",")).join(" ");
  const ranked = DIMS.map(([k]) => [k, india?.dims?.[k]]).filter(([, v]) => v != null).sort((a, b) => b[1] - a[1]);
  const fName = focus ? (sel.type === "state" ? focus.state : focus.city) : null;
  return (
    <section className="rounded-3xl border hair bg-card p-6">
      <h2 className="font-display text-[22px] font-bold">Services at a glance</h2>
      <p className="text-[13px] text-mute">National average for each service{fName ? `, compared with ${fName}` : ""}.</p>
      <div className="mt-2 grid items-center gap-4 md:grid-cols-[1fr_200px] xl:grid-cols-1 2xl:grid-cols-[1fr_200px]">
        <svg viewBox="-40 -6 380 312" className="mx-auto w-full max-w-[380px]" role="img" aria-label="Radar chart of service scores">
          {[25, 50, 75, 100].map((g) => <polygon key={g} points={DIMS.map((_, i) => pt(i, g).join(",")).join(" ")} fill="none" stroke="currentColor" opacity=".1" />)}
          {DIMS.map(([k], i) => { const [x, y] = pt(i, 100); const [lx, ly] = pt(i, 122); return <g key={k}><line x1={C} y1={C} x2={x} y2={y} stroke="currentColor" opacity=".1" /><text x={lx} y={ly + 4} textAnchor="middle" fontSize="10.5" fontWeight="600" fill="currentColor" opacity=".7">{SHORT[k]}</text></g>; })}
          {india?.dims && <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 1 }} points={poly(india.dims)} fill="#3B3FD8" fillOpacity=".18" stroke="#3B3FD8" strokeWidth="2" />}
          {focus?.dims && <motion.polygon key={fName} initial={{ opacity: 0 }} animate={{ opacity: 1 }} points={poly(focus.dims)} fill="#FF7A2F" fillOpacity=".18" stroke="#FF7A2F" strokeWidth="2" />}
        </svg>
        <div>
          <ul className="space-y-1.5 text-[13px]">{ranked.map(([k, v], i) => <li key={k} className="flex items-center gap-2"><span className="tab w-4 text-faint">{i + 1}</span><span className="flex-1">{SHORT[k]}</span><span className="tab font-bold" style={{ color: band(v)[1] }}>{r0(v)}</span></li>)}</ul>
          <div className="mt-3 flex flex-wrap gap-3 text-[11.5px]"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo" />India</span>{fName && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-saffron" />{fName}</span>}</div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Weekly trend ---------- */
function Trend({ trend }) {
  const W = 560, H = 220, P = 30;
  if (!trend.length) return <section className="rounded-3xl border hair bg-card p-6"><h2 className="font-display text-[22px] font-bold">Weekly trend</h2><p className="mt-6 text-[13.5px] text-mute">The trend appears once responses come in.</p></section>;
  const maxN = Math.max(...trend.map((t) => t.responses), 1); const bw = (W - P * 2) / trend.length;
  const y = (s) => H - P - ((s ?? 0) / 100) * (H - P * 2);
  const line = trend.map((t, i) => `${P + bw * i + bw / 2},${y(t.score)}`).join(" ");
  return (
    <section className="rounded-3xl border hair bg-card p-6">
      <div className="flex flex-wrap items-end justify-between gap-2"><div><h2 className="font-display text-[22px] font-bold">Weekly trend</h2><p className="text-[13px] text-mute">Responses each week (bars) and the average score (line).</p></div><div className="flex gap-3 text-[11.5px]"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-indigo/30" />Responses</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-saffron" />Score</span></div></div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Weekly responses and score">
        {[0, 50, 100].map((g) => <g key={g}><line x1={P} x2={W - P} y1={y(g)} y2={y(g)} stroke="currentColor" opacity=".08" /><text x={P - 6} y={y(g) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity=".45">{g}</text></g>)}
        {trend.map((t, i) => { const h = (t.responses / maxN) * (H - P * 2) * 0.85; return <g key={t.week}><motion.rect initial={{ height: 0, y: H - P }} animate={{ height: h, y: H - P - h }} x={P + bw * i + bw * 0.18} width={bw * 0.64} rx="6" fill="#3B3FD8" opacity=".25" /><text x={P + bw * i + bw / 2} y={H - 10} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".5">{new Date(t.week).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</text><text x={P + bw * i + bw / 2} y={H - P - h - 6} textAnchor="middle" fontSize="10" fontWeight="700" fill="#3B3FD8">{t.responses}</text></g>; })}
        <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1 }} points={line} fill="none" stroke="#FF7A2F" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {trend.map((t, i) => t.score != null && <circle key={t.week} cx={P + bw * i + bw / 2} cy={y(t.score)} r="4.5" fill="#fff" stroke="#FF7A2F" strokeWidth="2.5"><title>{`${r0(t.score)}/100`}</title></circle>)}
      </svg>
    </section>
  );
}

/* ---------- City by service heatmap ---------- */
function Heatmap({ cities, onPick }) {
  const [sortK, setSortK] = useState("responses");
  const rows = useMemo(() => [...cities].sort((a, b) => (sortK === "responses" ? b.responses - a.responses : sortK === "score" ? b.score - a.score : (b.dims?.[sortK] ?? -1) - (a.dims?.[sortK] ?? -1))).slice(0, 15), [cities, sortK]);
  if (!cities.length) return null;
  const head = (k, l) => <th key={k} className="px-1 pb-2"><button onClick={() => setSortK(k)} className={`focusable w-full rounded-lg px-1 py-1 text-[11px] font-bold uppercase tracking-wide ${sortK === k ? "bg-ink text-bg" : "text-faint hover:text-ink"}`}>{l}</button></th>;
  return (
    <section className="mt-6 rounded-3xl border hair bg-card p-6">
      <h2 className="font-display text-[22px] font-bold">City by service heatmap</h2>
      <p className="text-[13px] text-mute">The 15 most rated cities. Select a column heading to sort, or a city to explore it.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[820px] border-separate border-spacing-1 text-center text-[12.5px]">
          <thead><tr><th className="pb-2 text-left text-[11px] font-bold uppercase tracking-wide text-faint">City</th>{head("score", "Overall")}{DIMS.map(([k]) => head(k, SHORT[k]))}{head("responses", "Responses")}</tr></thead>
          <tbody>{rows.map((c) => (
            <tr key={cityKey(c.state, c.city)}>
              <td className="pr-2 text-left"><button onClick={() => onPick(c)} className="focusable rounded text-left"><span className="block text-[13.5px] font-bold">{c.city}</span><span className="text-[11px] text-faint">{c.state}</span></button></td>
              {[c.score, ...DIMS.map(([k]) => c.dims?.[k])].map((v, i) => <td key={i} className="rounded-lg font-bold tab" style={{ background: v == null ? "rgb(var(--line) / 0.06)" : `${band(v)[1]}${i === 0 ? "" : "CC"}`, color: v == null ? undefined : "#fff", height: 38 }}>{r0(v)}</td>)}
              <td className="tab font-semibold text-mute">{c.responses}</td>
            </tr>))}</tbody>
        </table>
      </div>
    </section>
  );
}

/* ---------- Leaderboard ---------- */
function Leaderboard({ cities, india, onPick }) {
  const [q, setQ] = useState(""); const [st, setSt] = useState("all"); const [all, setAll] = useState(false);
  const list = cities.filter((c) => (st === "all" || c.state === st) && (!q || `${c.city} ${c.state}`.toLowerCase().includes(q.toLowerCase())));
  const csv = () => {
    const rows = [["Rank", "City", "State", "Responses", "Overall", ...DIMS.map(([, l]) => l)], ...cities.map((c, i) => [i + 1, c.city, c.state, c.responses, r0(c.score), ...DIMS.map(([k]) => r0(c.dims?.[k]))])];
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv" })); a.download = "all-india-city-survey.csv"; a.click();
  };
  return (
    <section id="leaderboard" className="mt-6 scroll-mt-24 rounded-3xl border hair bg-card p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="flex-1 font-display text-[22px] font-bold">All cities ranked</h2>
        <div className="relative"><Search size={15} className="absolute left-3 top-3 text-faint" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search city" aria-label="Search city" className="focusable h-10 w-44 rounded-full border hair2 bg-bg pl-9 pr-3 text-[13.5px] outline-none" /></div>
        <select value={st} onChange={(e) => setSt(e.target.value)} aria-label="Filter by State" className="focusable h-10 rounded-full border hair2 bg-bg px-3 text-[13.5px]"><option value="all">All States and UTs</option>{[...new Set(cities.map((c) => c.state))].sort().map((s) => <option key={s}>{s}</option>)}</select>
        <button onClick={csv} className="focusable inline-flex h-10 items-center gap-1.5 rounded-full bg-raised px-4 text-[13px] font-semibold"><Download size={15} />CSV</button>
      </div>
      {!list.length ? <p className="mt-6 text-[13.5px] text-mute">No cities match.</p> : (
        <ol className="mt-5 space-y-1.5">
          {(all ? list : list.slice(0, 12)).map((c) => { const rank = cities.indexOf(c) + 1; const col = band(c.score)[1]; return (
            <li key={cityKey(c.state, c.city)}><button onClick={() => onPick(c)} className="focusable grid w-full grid-cols-[36px_minmax(120px,220px)_1fr_48px] items-center gap-3 rounded-2xl px-2 py-2 text-left hover:bg-raised">
              <span className={`tab flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-extrabold ${rank <= 3 ? "text-white" : "bg-raised text-mute"}`} style={rank <= 3 ? { background: ["#F5B400", "#9CA3AF", "#B45309"][rank - 1] } : undefined}>{rank}</span>
              <span className="min-w-0"><span className="block truncate text-[14px] font-bold">{c.city}</span><span className="block truncate text-[11.5px] text-faint">{c.state} · {c.responses} responses</span></span>
              <span className="relative h-3 rounded-full bg-line/10"><motion.span initial={{ width: 0 }} animate={{ width: `${c.score}%` }} transition={{ duration: 0.8 }} className="absolute inset-y-0 left-0 rounded-full" style={{ background: `linear-gradient(90deg, ${col}99, ${col})` }} />{india?.score != null && <span className="absolute -top-1 h-5 w-[2px] bg-ink/40" style={{ left: `${india.score}%` }} />}</span>
              <span className="tab text-right font-display text-[18px] font-extrabold" style={{ color: col }}>{r0(c.score)}</span>
            </button></li>); })}
        </ol>
      )}
      {list.length > 12 && <button onClick={() => setAll(!all)} className="focusable mt-3 rounded-full px-3 py-2 text-[13.5px] font-semibold text-indigo hover:bg-raised">{all ? "Show top 12" : `Show all ${list.length} cities`}</button>}
    </section>
  );
}

function Method() {
  return (
    <section className="mt-6 grid gap-4 rounded-3xl bg-raised p-6 text-[13px] text-mute md:grid-cols-3">
      <div><p className="font-bold text-ink">How scores work</p><p className="mt-1">Signed in citizens rate their city from 1 (Very poor) to 5 (Excellent) on up to 8 services. Each average is converted to 0 to 100. The overall score is the average of the services.</p></div>
      <div><p className="font-bold text-ink">Privacy</p><p className="mt-1">Individual answers are never shown. A city or State appears only once at least {MIN_RESPONSES} people have rated it, and only averages are published.</p></div>
      <div><p className="font-bold text-ink">What this is, and is not</p><p className="mt-1 flex gap-2"><Info size={14} className="mt-0.5 shrink-0" />An opinion survey of people using One Youth One India, not an official statistic or a random sample of the population.</p></div>
    </section>
  );
}
