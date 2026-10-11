import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  GraduationCap, HeartPulse, Construction, Droplets, Zap, ShieldAlert, Landmark, ShoppingBag, Trees, Baby, Wheat, IdCard, FileText, Siren, Scale, TrainFront, Car, Flame, Banknote, Mail, PiggyBank, Briefcase, Sprout, Receipt, House, Building2, Tractor, HeartHandshake, Smartphone, Phone, ExternalLink, ChevronDown, Navigation, LocateFixed, EyeOff, Eye, LogIn, LogOut, Gavel, HandCoins, Camera, Video, ImagePlus, Fingerprint, Trash2, Eraser, BadgeCheck, Hourglass, Mic, MicOff, Languages, AtSign, UserRound, Search, Plus, Megaphone,
  ThumbsUp, Flag, MapPin, Star, Sun, Moon, X, Check, Lock, Globe2, Sparkles, TrendingUp, ShieldCheck, User, AlertTriangle,
  MessageSquare, Loader2, ArrowRight, Users, CheckCircle2, Activity, Inbox,
} from "lucide-react";
import { VOICE_LANGS, langName, CONTACT, CATEGORIES, CHANNELS, HELPLINES, MAP_FINDERS, mapsUrl, searchUrl, catById, STATES, GEO, districtsOf, tehsilsOf, citiesOf, SEVERITY, STATUSES, STATUS_TONE, timeAgo, findPersonalData, maskPersonalData } from "./data.js";
import { connect } from "./store.js";
import { LEGAL } from "./legal.js";
import { prepare, renderPhoto, sha256, LIMITS } from "./evidence.js";

const COVERAGE = { states: GEO.length, districts: GEO.reduce((n, s) => n + s.districts.length, 0), tehsils: GEO.reduce((n, s) => n + s.districts.reduce((m, d) => m + d.tehsils.length, 0), 0), cities: GEO.reduce((n, s) => n + s.cities.length, 0) };
const ICONS = { GraduationCap, HeartPulse, Construction, Droplets, Zap, ShieldAlert, Landmark, ShoppingBag, Trees, Baby, Wheat, IdCard, FileText, Siren, Scale, TrainFront, Car, Flame, Banknote, Mail, PiggyBank, Briefcase, Sprout, Receipt, House, Building2, Tractor, HeartHandshake, Smartphone, HandCoins };
const CatIcon = ({ id, ...p }) => { const C = ICONS[catById(id).icon] || Landmark; return <C aria-hidden="true" {...p} />; };

function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden="true">
        <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF7A2F" /><stop offset=".5" stopColor="#3B3FD8" /><stop offset="1" stopColor="#13A86B" /></linearGradient></defs>
        <path d="M20 3c-7.7 0-14 6-14 13.6C6 26.4 20 37 20 37s14-10.6 14-20.4C34 9 27.7 3 20 3z" fill="url(#lg)" />
        <path d="M13 13.5h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-7.5L15 27v-3.5h-2a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2z" fill="#fff" />
        <circle cx="16" cy="18.5" r="1.4" fill="#3B3FD8" /><circle cx="20" cy="18.5" r="1.4" fill="#3B3FD8" /><circle cx="24" cy="18.5" r="1.4" fill="#3B3FD8" />
      </svg>
      <span className="font-display text-[15px] font-extrabold leading-none tracking-[-0.03em] sm:text-[19px]">OneYouth<span className="bg-gradient-to-r from-saffron via-indigo to-leaf bg-clip-text text-transparent">OneIndia</span></span>
    </span>
  );
}

const Stars = ({ value, size = 15 }) => (
  <span className="flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={size} className={n <= value ? "fill-sun text-sun" : "text-faint/50"} aria-hidden="true" />)}
  </span>
);

function SeverityBar({ level }) {
  const i = SEVERITY.indexOf(level);
  const c = ["#13A86B", "#F5B400", "#FF7A2F", "#E5484D"][i];
  return (
    <span className="flex items-center gap-2" aria-label={`Severity ${level}`}>
      <span className="flex gap-0.5">{[0, 1, 2, 3].map((n) => <span key={n} className="h-2.5 w-3.5 rounded-sm" style={{ background: n <= i ? c : "rgb(var(--line) / 0.12)" }} />)}</span>
      <span className="text-[12.5px] font-semibold" style={{ color: c }}>{level}</span>
    </span>
  );
}

/* ---------------- Evidence media ---------------- */
function useMedia(resolve, ev) {
  const [url, setUrl] = useState(ev.previewUrl || "");
  useEffect(() => { let on = true; if (!ev.previewUrl && resolve) Promise.resolve(resolve(ev)).then((u) => on && setUrl(u || "")).catch(() => {}); return () => { on = false; }; }, [ev.ref]); // eslint-disable-line
  return url;
}
function MediaTile({ ev, resolve, onOpen, badge }) {
  const url = useMedia(resolve, ev);
  return (
    <button type="button" onClick={() => onOpen?.(ev, url)} className="focusable group relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-raised" aria-label={ev.kind === "video" ? "Play evidence video" : "View evidence photo"}>
      {url ? (ev.kind === "video" ? <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" /> : <img src={url} alt="Evidence uploaded by a citizen" className="h-full w-full object-cover transition group-hover:scale-105" />) : <span className="flex h-full items-center justify-center"><Loader2 size={18} className="animate-spin text-faint" /></span>}
      {ev.kind === "video" && <span className="absolute inset-0 flex items-center justify-center"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white"><Video size={20} /></span></span>}
      {badge && <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: badge[1] }}>{badge[0]}</span>}
    </button>
  );
}
function Lightbox({ item, onClose }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const { ev, url } = item;
  return (
    <motion.div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-black/90 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} role="dialog" aria-label="Evidence viewer">
      <button onClick={onClose} className="focusable absolute right-4 top-4 rounded-full bg-white/10 p-2.5 text-white" aria-label="Close" style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}><X size={22} /></button>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[80vh] max-w-5xl items-center justify-center">
        {ev.kind === "video" ? <video src={url} controls autoPlay playsInline className="max-h-[80vh] max-w-full rounded-2xl" /> : <img src={url} alt="Evidence" className="max-h-[80vh] max-w-full rounded-2xl object-contain" />}
      </div>
      {ev.sha256 && <p onClick={(e) => e.stopPropagation()} className="flex max-w-full items-center gap-2 break-all rounded-full bg-white/10 px-4 py-2 text-[11.5px] text-white/80"><Fingerprint size={14} className="shrink-0" />SHA-256 {ev.sha256}</p>}
    </motion.div>
  );
}
function BlurEditor({ item, onDone, onClose }) {
  const [boxes, setBoxes] = useState(item.boxes || []);
  const [drag, setDrag] = useState(null);
  const [busy, setBusy] = useState(false);
  const ref = useRef();
  const pt = (e) => { const r = ref.current.getBoundingClientRect(); return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) }; };
  const down = (e) => { e.preventDefault(); ref.current.setPointerCapture(e.pointerId); const p = pt(e); setDrag({ x0: p.x, y0: p.y, x: p.x, y: p.y }); };
  const move = (e) => drag && setDrag({ ...drag, ...pt(e) });
  const up = () => { if (drag) { const b = { x: Math.min(drag.x0, drag.x), y: Math.min(drag.y0, drag.y), w: Math.abs(drag.x - drag.x0), h: Math.abs(drag.y - drag.y0) }; if (b.w > 0.02 && b.h > 0.02) setBoxes([...boxes, b]); } setDrag(null); };
  const apply = async () => { setBusy(true); const out = await renderPhoto(item.sourceUrl, boxes); onDone({ ...item, ...out, boxes }); };
  const live = drag ? { x: Math.min(drag.x0, drag.x), y: Math.min(drag.y0, drag.y), w: Math.abs(drag.x - drag.x0), h: Math.abs(drag.y - drag.y0) } : null;
  return (
    <motion.div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/70 p-4 backdrop-blur" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-label="Blur faces and number plates">
      <div className="w-full max-w-3xl rounded-[28px] bg-card p-5 shadow-2xl">
        <div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-display text-[20px] font-bold"><Eraser size={19} className="text-indigo" />Blur faces, number plates and names</h3><button onClick={onClose} className="focusable rounded-full p-2 text-mute" aria-label="Close"><X size={20} /></button></div>
        <p className="mt-1 text-[13px] text-mute">Drag over anything that identifies a bystander, a child, a vehicle or a private document.</p>
        <div ref={ref} onPointerDown={down} onPointerMove={move} onPointerUp={up} className="relative mt-4 touch-none select-none overflow-hidden rounded-2xl bg-raised" style={{ cursor: "crosshair" }}>
          <img src={item.sourceUrl} alt="Photo to edit" draggable={false} className="block max-h-[60vh] w-full object-contain" />
          {[...boxes, ...(live ? [live] : [])].map((b, i) => <span key={i} className="pointer-events-none absolute border-2 border-white bg-indigo/40 backdrop-blur-md" style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.w * 100}%`, height: `${b.h * 100}%` }} />)}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[13px] text-mute">{boxes.length} area{boxes.length === 1 ? "" : "s"} selected</span>
          <div className="flex gap-2">
            <button onClick={() => setBoxes(boxes.slice(0, -1))} disabled={!boxes.length} className="focusable h-11 rounded-full border hair2 px-4 text-[13.5px] font-semibold disabled:opacity-40">Undo</button>
            <button onClick={apply} disabled={busy} className="focusable inline-flex h-11 items-center gap-2 rounded-full bg-indigo px-5 text-[14px] font-bold text-white">{busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Apply blur</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ---------------- Voice typing ---------------- */
function VoiceTyping({ lang, setLang, onText, translate }) {
  const SR = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;
  const [on, setOn] = useState(false);
  const [interim, setInterim] = useState("");
  const [msg, setMsg] = useState(SR ? "" : "unsupported");
  const rec = useRef(null);
  const level = useRef(0);
  useEffect(() => () => rec.current?.abort?.(), []);
  const start = () => {
    if (!SR) { setMsg("unsupported"); return; }
    setMsg("");
    const r = new SR();
    r.lang = lang; r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
    r.onresult = (e) => {
      let fin = "", tmp = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) fin += t; else tmp += t; }
      if (fin) onText(fin.trim());
      setInterim(tmp);
    };
    r.onerror = (e) => { setMsg(e.error === "not-allowed" || e.error === "service-not-allowed" ? "blocked" : e.error === "no-speech" ? "nospeech" : e.error === "language-not-supported" ? "lang" : "error"); setOn(false); };
    r.onend = () => { setOn(false); setInterim(""); };
    try { r.start(); rec.current = r; setOn(true); } catch { setMsg("error"); }
  };
  const stop = () => { rec.current?.stop(); setOn(false); };
  const notes = {
    unsupported: "Voice typing isn't supported in this browser. Use Chrome, or tap the microphone on your phone keyboard (Gboard and the iPhone keyboard support Indian languages).",
    blocked: "Microphone access is blocked here. Allow the microphone in your browser settings, or use the microphone on your phone keyboard.",
    nospeech: "We didn't hear anything. Tap Speak and try again.",
    lang: "This browser doesn't support that language for voice typing. Try Chrome, or your phone keyboard's microphone.",
    error: "Voice typing stopped. Check your connection and try again, or use your phone keyboard's microphone.",
  };
  return (
    <div className="mb-2 rounded-2xl bg-raised p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-mute"><Languages size={15} className="text-indigo" />Speak in</span>
        <label htmlFor="c-lang" className="sr-only">Voice language</label>
        <select id="c-lang" value={lang} onChange={(e) => { setLang(e.target.value); if (on) stop(); }} className="focusable h-9 rounded-full border hair2 bg-card px-3 text-[13px] font-semibold">{VOICE_LANGS.map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select>
        <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={on ? stop : start} aria-pressed={on} className={`focusable relative ml-auto inline-flex h-10 items-center gap-2 rounded-full px-4 text-[13.5px] font-bold text-white ${on ? "bg-ruby" : "bg-indigo"}`}>
          {on && <span className="absolute inset-0 animate-ping2 rounded-full bg-ruby/50" aria-hidden="true" />}
          <span className="relative flex items-center gap-2">{on ? <><MicOff size={16} />Stop</> : <><Mic size={16} />Speak</>}</span>
        </motion.button>
      </div>
      {on && <p className="mt-2 flex items-center gap-2 text-[13px]" aria-live="polite"><span className="flex gap-0.5" aria-hidden="true">{[0, 1, 2, 3].map((i) => <motion.span key={i} className="w-1 rounded-full bg-ruby" animate={{ height: [6, 16, 6] }} transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.12 }} />)}</span><span className="text-mute">{interim || `Listening in ${langName(lang)}…`}</span></p>}
      {msg && <p className="mt-2 text-[12.5px] text-mute" role="status">{notes[msg]}</p>}
      {translate && <button type="button" onClick={translate.run} disabled={translate.busy} className="focusable mt-2 inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-semibold text-indigo disabled:opacity-50">{translate.busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}Add English translation for officials</button>}
    </div>
  );
}

/* ---------------- Composer ---------------- */
const Field = ({ label, id, error, children }) => (
  <div><label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold">{label}</label>{children}{error && <p className="mt-1 text-[12.5px] text-ruby">{error}</p>}</div>
);
function Composer({ onClose, onSubmit, canWrite, upload, canUpload, sample }) {
  const [catQ, setCatQ] = useState("");
  const [items, setItems] = useState([]);
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("oyoi-lang") || "hi-IN"; } catch { return "hi-IN"; } });
  const [tBusy, setTBusy] = useState(false);
  useEffect(() => { try { localStorage.setItem("oyoi-lang", lang); } catch { /* ignore */ } }, [lang]);
  const addSpoken = (t) => setF((s) => ({ ...s, body: (s.body ? `${s.body.replace(/\s+$/, "")} ` : "") + t }));
  const translate = sample && lang !== "en-IN" ? { busy: tBusy, run: async () => {
    if (!f.body.trim()) return;
    setTBusy(true);
    try {
      const { text } = await sample(`Translate this citizen complaint from ${langName(lang)} into clear, neutral English. Keep facts, places and numbers exactly. Reply with only the translation.\n\n${f.body}`, { cache: false });
      setF((s) => ({ ...s, body: `${s.body.trim()}\n\nEnglish: ${text.trim()}` }));
    } catch { /* ignore */ }
    setTBusy(false);
  } } : null;
  const [audience, setAudience] = useState("public");
  const [pickErr, setPickErr] = useState("");
  const [editing, setEditing] = useState(null);
  const [progress, setProgress] = useState("");
  const fileRef = useRef();
  const pick = async (files) => {
    setPickErr("");
    for (const file of files) {
      const photos = items.filter((i) => i.kind === "image").length, videos = items.filter((i) => i.kind === "video").length;
      if (file.type.startsWith("image/") && photos >= LIMITS.photos) { setPickErr(`Up to ${LIMITS.photos} photos per post.`); continue; }
      if (file.type.startsWith("video/") && videos >= LIMITS.videos) { setPickErr("One video per post."); continue; }
      try { const it = await prepare(file); setItems((x) => [...x, it]); } catch (e) { setPickErr(e.message); }
    }
  };
  const [f, setF] = useState({ type: "issue", cat: "roads", sub: "", entity: "", city: "", state: "Karnataka", district: "", tehsil: "", rating: 0, severity: "Medium", title: "", body: "", visibility: "public", anon: false, agree: false });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const pii = findPersonalData(`${f.title} ${f.body}`);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const submit = async () => {
    const e = {};
    if (!f.entity.trim()) e.entity = "Name the place, service or product";
    if (!f.district) e.district = "Choose a district";
    if (!f.city.trim()) e.city = "Add a city, town or village";
    if (f.type === "review" && !f.rating) e.rating = "Choose a rating";
    if (f.title.trim().length < 6) e.title = "Add a short headline";
    if (f.body.trim().length < 20) e.body = "Describe what happened in at least 20 characters";
    if (!f.agree) e.agree = "Please confirm the guidelines";
    setErr(e);
    if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const evidence = [];
      for (let n = 0; n < items.length; n++) {
        const it = items[n];
        setProgress(`Securing evidence ${n + 1} of ${items.length}`);
        const hash = await sha256(it.blob);
        const { ref } = await upload(it.blob, it.kind);
        evidence.push({ id: it.id, kind: it.kind, ref, sha256: hash, size: it.blob.size, w: it.w || null, h: it.h || null, duration: it.duration ? Math.round(it.duration) : null, blurred: (it.boxes || []).length, audience, createdAt: new Date().toISOString() });
      }
      setProgress("");
      const p = await onSubmit({ evidence, lang: lang !== "en-IN" ? lang : null, type: f.type, cat: f.cat, sub: f.sub, entity: f.entity.trim(), city: f.city.trim(), state: f.state, district: f.district, tehsil: f.tehsil, rating: f.type === "review" ? f.rating : null, severity: f.type === "issue" ? f.severity : null, title: maskPersonalData(f.title.trim()), body: maskPersonalData(f.body.trim()), visibility: f.visibility, anon: f.anon });
      setDone(p);
    } catch (e2) { setProgress(""); setErr({ submit: e2?.message || "Could not save. Please try again." }); }
    setBusy(false);
  };
  const input = "focusable h-11 w-full rounded-xl border hair2 bg-raised px-3.5 text-[14.5px] outline-none transition focus:border-indigo";
  return (
    <motion.div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div role="dialog" aria-label="Share your voice" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} onMouseDown={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-card shadow-2xl sm:rounded-[28px]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <header className="flex items-center justify-between border-b hair px-6 py-4">
          <h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">{done ? "Thank you for speaking up" : "Share your voice"}</h2>
          <button onClick={onClose} className="focusable rounded-full p-2 text-mute hover:bg-raised" aria-label="Close"><X size={20} /></button>
        </header>
        {done ? (
          <div className="flex flex-col items-center gap-4 px-8 py-12 text-center">
            <motion.span initial={{ scale: 0.4, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-saffron via-indigo to-leaf text-white"><Check size={38} strokeWidth={3} /></motion.span>
            <p className="font-display text-[26px] font-bold">{done.visibility === "private" ? "Private feedback saved" : "Your voice is live"}</p>
            <p className="max-w-md text-[15px] text-mute">{done.visibility === "private" ? "Only you can see it in My activity. In the full platform it goes straight to the organisation." : "Others can now support it with Me too. Track its status as it moves from Open to Resolved."}</p>
            <button onClick={onClose} className="focusable mt-2 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[14.5px] font-semibold text-bg">Done</button>
          </div>
        ) : (
          <div className="space-y-5 overflow-y-auto px-6 py-6">
            {!canWrite && <p className="rounded-xl bg-saffron/10 p-3 text-[13px] text-ink">You can read everything here. Posting needs Contributor access to this page.</p>}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-raised p-1.5" role="radiogroup" aria-label="What do you want to share">
              {[["issue", "Report an issue", AlertTriangle], ["review", "Write a review", Star]].map(([k, l, I]) => (
                <button key={k} role="radio" aria-checked={f.type === k} onClick={() => set("type", k)} className={`focusable flex h-11 items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition ${f.type === k ? "bg-card shadow" : "text-mute"}`}><I size={16} />{l}</button>
              ))}
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3"><p className="text-[13px] font-semibold">Category</p><label htmlFor="c-q" className="sr-only">Find a category</label><input id="c-q" value={catQ} onChange={(e) => setCatQ(e.target.value)} placeholder="Find a category" className="focusable h-9 w-44 rounded-full border hair2 bg-raised px-3.5 text-[13px] outline-none" /></div>
              <div className="grid max-h-[232px] grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                {CATEGORIES.filter((c) => (c.name + c.hint + c.subs.join(" ")).toLowerCase().includes(catQ.toLowerCase())).map((c) => (
                  <button key={c.id} onClick={() => setF((s) => ({ ...s, cat: c.id, sub: "" }))} aria-pressed={f.cat === c.id} className={`focusable flex items-center gap-2.5 rounded-xl border p-2.5 text-left text-[12.5px] font-semibold leading-tight transition ${f.cat === c.id ? "border-transparent text-white" : "hair2 hover:bg-raised"}`} style={f.cat === c.id ? { background: c.color } : undefined}>
                    <CatIcon id={c.id} size={17} className="shrink-0" />{c.name}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Type of place or service" id="c-sub"><select id="c-sub" className={input} value={f.sub} onChange={(e) => set("sub", e.target.value)}><option value="">Choose one (optional)</option>{catById(f.cat).subs.map((x) => <option key={x}>{x}</option>)}<option>Other</option></select></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-3"><Field label="Place, service or product" id="c-e" error={err.entity}><input id="c-e" className={input} value={f.entity} onChange={(e) => set("entity", e.target.value)} placeholder="e.g. City General Hospital, MG Road, Ward 12 water supply" /></Field></div>
              <Field label="State or union territory" id="c-s"><select id="c-s" className={input} value={f.state} onChange={(e) => setF((s) => ({ ...s, state: e.target.value, district: "", tehsil: "" }))}>{STATES.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="District" id="c-d" error={err.district}><select id="c-d" className={input} value={f.district} onChange={(e) => setF((s) => ({ ...s, district: e.target.value, tehsil: "" }))}><option value="">Choose district</option>{districtsOf(f.state).map((d) => <option key={d.code}>{d.name}</option>)}</select></Field>
              <Field label="Tehsil (optional)" id="c-th"><select id="c-th" className={input} value={f.tehsil} onChange={(e) => set("tehsil", e.target.value)} disabled={!f.district}><option value="">{f.district ? "Choose tehsil" : "Choose district first"}</option>{tehsilsOf(f.state, f.district).map((t) => <option key={t}>{t}</option>)}</select></Field>
              <div className="sm:col-span-3"><Field label="City, town or village" id="c-c" error={err.city}><input id="c-c" list="c-cities" className={input} value={f.city} onChange={(e) => set("city", e.target.value)} placeholder="Start typing; cities and towns are suggested, or type your village" /><datalist id="c-cities">{citiesOf(f.state).map((c) => <option key={c} value={c} />)}</datalist></Field></div>
            </div>
            {f.type === "review" ? (
              <Field label="Your rating" id="c-r" error={err.rating}>
                <div className="flex gap-1" id="c-r">{[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => set("rating", n)} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="focusable rounded-lg p-1"><Star size={30} className={n <= f.rating ? "fill-sun text-sun" : "text-faint"} /></button>)}</div>
              </Field>
            ) : (
              <Field label="How serious is it?" id="c-v">
                <div className="grid grid-cols-4 gap-2" id="c-v">{SEVERITY.map((s, i) => <button key={s} onClick={() => set("severity", s)} aria-pressed={f.severity === s} className={`focusable h-10 rounded-xl border text-[13px] font-semibold ${f.severity === s ? "border-transparent text-white" : "hair2"}`} style={f.severity === s ? { background: ["#13A86B", "#F5B400", "#FF7A2F", "#E5484D"][i] } : undefined}>{s}</button>)}</div>
              </Field>
            )}
            <Field label="Headline" id="c-t" error={err.title}><input id="c-t" className={input} value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={90} placeholder={f.type === "issue" ? "e.g. Deep pothole near the bus stop" : "e.g. Caring staff in the paediatric ward"} /></Field>
            <Field label="What happened? Type or speak in your language" id="c-b" error={err.body}><VoiceTyping lang={lang} setLang={setLang} onText={addSpoken} translate={translate} /><textarea id="c-b" dir="auto" rows={4} className={`${input} h-auto py-3`} value={f.body} onChange={(e) => set("body", e.target.value)} maxLength={1200} placeholder="Describe facts: what, where and when. Avoid personal attacks." /></Field>
            <div className="rounded-2xl border hair2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><p className="flex items-center gap-2 text-[14px] font-bold"><Camera size={17} className="text-saffron" />Evidence (optional)</p><p className="mt-0.5 text-[12.5px] text-mute">Up to {LIMITS.photos} photos and 1 video ({LIMITS.videoSeconds} seconds, {LIMITS.videoMB} MB). Photos lose hidden location data automatically.</p></div>
                <button type="button" onClick={() => fileRef.current?.click()} disabled={!canUpload} className="focusable inline-flex h-10 items-center gap-2 rounded-full bg-saffron/10 px-4 text-[13.5px] font-bold text-saffron disabled:opacity-40"><ImagePlus size={16} />Add photo or video</button>
                <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="sr-only" onChange={(e) => { pick([...e.target.files]); e.target.value = ""; }} aria-label="Choose photos or a video" />
              </div>
              {!canUpload && <p className="mt-2 text-[12.5px] text-mute">Sign in, or get Contributor access, to upload evidence.</p>}
              {pickErr && <p className="mt-2 text-[12.5px] text-ruby" role="alert">{pickErr}</p>}
              {items.length > 0 && (
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {items.map((it) => (
                    <li key={it.id} className="relative overflow-hidden rounded-xl bg-raised">
                      {it.kind === "video" ? <video src={it.url} muted playsInline className="aspect-square w-full object-cover" /> : <img src={it.url} alt="Selected evidence" className="aspect-square w-full object-cover" />}
                      <div className="absolute inset-x-1 bottom-1 flex gap-1">
                        {it.kind === "image" && <button type="button" onClick={() => setEditing(it)} className="focusable flex-1 rounded-lg bg-black/60 px-2 py-1 text-[11px] font-bold text-white"><Eraser size={11} className="mr-1 inline" />{it.boxes?.length ? `Blurred ${it.boxes.length}` : "Blur"}</button>}
                        {it.kind === "video" && <span className="flex-1 rounded-lg bg-black/60 px-2 py-1 text-center text-[11px] font-bold text-white">{Math.round(it.duration)}s video</span>}
                        <button type="button" onClick={() => setItems(items.filter((x) => x.id !== it.id))} className="focusable rounded-lg bg-black/60 px-2 py-1 text-white" aria-label="Remove"><Trash2 size={12} /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {items.length > 0 && (
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {[["public", "Public after review", "Moderators check it, then everyone can see it", Globe2], ["moderators", "Moderators only", "Recommended for bribery and sensitive cases", Lock]].map(([k, l, d, I]) => (
                    <button key={k} type="button" onClick={() => setAudience(k)} aria-pressed={audience === k} className={`focusable flex items-start gap-2.5 rounded-xl border p-3 text-left ${audience === k ? "border-indigo bg-indigo/5" : "hair2"}`}><I size={16} className={audience === k ? "text-indigo" : "text-mute"} /><span><span className="block text-[13px] font-semibold">{l}</span><span className="text-[12px] text-mute">{d}</span></span></button>
                  ))}
                </div>
              )}
              {items.some((i) => i.kind === "video") && <p className="mt-3 flex items-start gap-2 rounded-xl bg-sun/15 p-3 text-[12.5px]"><AlertTriangle size={15} className="mt-0.5 shrink-0" />Videos can carry hidden location data that cannot be removed in the browser. If that matters, turn off camera location before recording or choose Moderators only.</p>}
              {(f.cat === "corruption" || items.length > 0) && <p className="mt-3 flex items-start gap-2 rounded-xl bg-ruby/10 p-3 text-[12.5px]"><ShieldAlert size={15} className="mt-0.5 shrink-0 text-ruby" />Your safety comes first: never confront anyone or put yourself at risk to record. For bribery, also file with the Anti Corruption Bureau, Lokayukta or the CVC using the Official channel button.</p>}
            </div>
            {pii.length > 0 && <p className="flex items-start gap-2 rounded-xl bg-ruby/10 p-3 text-[13px]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-ruby" />We spotted a {pii.join(", ")}. It will be removed automatically to protect privacy.</p>}
            <div className="grid gap-3 sm:grid-cols-2">
              {[["public", "Public", "Everyone can see and support it", Globe2], ["private", "Private", "Only you, and the organisation in the full platform", Lock]].map(([k, l, d, I]) => (
                <button key={k} onClick={() => set("visibility", k)} aria-pressed={f.visibility === k} className={`focusable flex items-start gap-3 rounded-2xl border p-4 text-left transition ${f.visibility === k ? "border-indigo bg-indigo/5" : "hair2"}`}>
                  <I size={18} className={f.visibility === k ? "text-indigo" : "text-mute"} /><span><span className="block text-[14px] font-semibold">{l}</span><span className="text-[12.5px] text-mute">{d}</span></span>
                </button>
              ))}
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-[14px]"><input type="checkbox" checked={f.anon} onChange={(e) => set("anon", e.target.checked)} className="h-5 w-5 accent-indigo" />Post as "Citizen" without my name</label>
            <label className="flex cursor-pointer items-start gap-3 text-[13.5px] text-mute"><input type="checkbox" checked={f.agree} onChange={(e) => set("agree", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-indigo" />I confirm this is my genuine experience, contains no personal attacks, hate or other people's private information, and follows the community guidelines.</label>
            {err.agree && <p className="text-[12.5px] text-ruby">{err.agree}</p>}
            {err.submit && <p className="text-[12.5px] text-ruby">{err.submit}</p>}
          </div>
        )}
        {!done && (
          <footer className="flex items-center justify-between gap-3 border-t hair px-6 py-4">
            <p className="hidden text-[12.5px] text-mute sm:block">{progress || "Personal numbers and emails are removed automatically."}</p>
            {editing && <BlurEditor item={editing} onClose={() => setEditing(null)} onDone={(it) => { setItems((x) => x.map((y) => (y.id === it.id ? it : y))); setEditing(null); }} />}
            <button onClick={submit} disabled={busy || !canWrite} className="focusable ml-auto inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-saffron via-indigo to-leaf px-7 text-[15px] font-bold text-white shadow-lg disabled:opacity-50">{busy ? <Loader2 size={18} className="animate-spin" /> : <><Megaphone size={18} />Publish</>}</button>
          </footer>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Official channels ---------------- */
function ChannelSheet({ cat, onClose }) {
  const c = catById(cat);
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-[65] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div role="dialog" aria-label="Official channels" initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-t-[28px] bg-card p-6 shadow-2xl sm:rounded-[28px]" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        <div className="flex items-start justify-between gap-4">
          <div><p className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: c.color }}><CatIcon id={c.id} size={15} />{c.name}</p><h2 className="mt-1 font-display text-[24px] font-bold tracking-[-0.02em]">Take it to the official channel</h2></div>
          <button onClick={onClose} className="focusable rounded-full p-2 text-mute" aria-label="Close"><X size={20} /></button>
        </div>
        <p className="mt-2 text-[14px] text-mute">Public voices build pressure. A formal complaint creates an official record and a response deadline.</p>
        <ul className="mt-5 space-y-2">
          {c.channels.map((k) => { const ch = CHANNELS[k]; return (
            <li key={k} className="flex items-center gap-3 rounded-2xl border hair p-4">
              <span className="min-w-0 flex-1"><span className="block text-[14.5px] font-semibold">{ch.name}</span><span className="text-[12.5px] text-mute">{ch.note}</span></span>
              {ch.tel && <a href={`tel:${ch.tel}`} className="focusable inline-flex h-9 items-center gap-1.5 rounded-full bg-leaf/10 px-3 text-[12.5px] font-bold text-leaf"><Phone size={14} />Call</a>}
              {ch.href && <a href={ch.href} target="_blank" rel="noopener noreferrer" className="focusable inline-flex h-9 items-center gap-1.5 rounded-full bg-indigo/10 px-3 text-[12.5px] font-bold text-indigo"><ExternalLink size={14} />Open</a>}
            </li>
          ); })}
        </ul>
        <p className="mt-4 text-[12px] text-faint">Numbers and portals can vary by state. In a life threatening emergency, call 112.</p>
      </motion.div>
    </motion.div>
  );
}

/* ---------------- Post card ---------------- */
function PostCard({ p, status, metoo, mine, flagged, onToggle, onStatus, isAdmin, name, onChannel, hidden, response, evStatus, resolve, me, onOpenMedia }) {
  const [open, setOpen] = useState(false);
  const c = catById(p.cat);
  const st = status || "Open";
  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border hair bg-card p-5 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition hover:shadow-[0_18px_50px_-24px_rgba(30,28,90,0.35)] md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold text-white" style={{ background: c.color }}><CatIcon id={p.cat} size={13} />{c.name}</span>
        <span className="rounded-full bg-raised px-2.5 py-1 text-[12px] font-semibold text-mute">{p.type === "issue" ? "Issue" : "Review"}</span>
        {p.sub && <span className="rounded-full bg-raised px-2.5 py-1 text-[12px] text-mute">{p.sub}</span>}
        {p.lang && <span className="inline-flex items-center gap-1 rounded-full bg-indigo/10 px-2.5 py-1 text-[12px] font-semibold text-indigo"><Languages size={12} />{langName(p.lang)}</span>}
        {p.sample && <span className="rounded-full border hair2 px-2.5 py-1 text-[11.5px] text-faint">Sample</span>}
        {hidden && <span className="inline-flex items-center gap-1 rounded-full bg-ruby/10 px-2.5 py-1 text-[11.5px] font-bold text-ruby"><EyeOff size={12} />Hidden from public</span>}
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ color: STATUS_TONE[st], background: `${STATUS_TONE[st]}1A` }}>{st === "Resolved" ? <CheckCircle2 size={13} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_TONE[st] }} />}{st}</span>
      </div>
      <h3 className="mt-3 font-display text-[19px] font-bold leading-snug tracking-[-0.01em]">{p.title}</h3>
      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mute"><span className="font-semibold text-ink">{p.entity}</span><span className="flex items-center gap-1"><MapPin size={13} />{[p.city, p.tehsil, p.district, p.state].filter(Boolean).join(", ")}</span></p>
      <div className="mt-3">{p.type === "review" ? <Stars value={p.rating} /> : <SeverityBar level={p.severity || "Medium"} />}</div>
      <p dir="auto" className={`mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink/85 ${open ? "" : "line-clamp-3"}`}>{p.body}</p>
      {p.body.length > 180 && <button onClick={() => setOpen(!open)} className="focusable mt-1 rounded text-[13px] font-semibold text-indigo">{open ? "Show less" : "Read more"}</button>}
      {(() => {
        const own = me && (p.ownerId || p.authorId) === me;
        const ev = (p.evidence || []).map((e) => ({ ...e, st: evStatus[e.id] || "pending" })).filter((e) => isAdmin || own || (e.st === "approved" && e.audience !== "moderators"));
        if (!ev.length) return null;
        return (
          <div className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold text-mute"><Camera size={14} />Evidence<span className="font-normal">· {ev.length} file{ev.length > 1 ? "s" : ""}</span>{ev.some((e) => e.st === "approved") && <span className="ml-1 inline-flex items-center gap-1 text-leaf"><BadgeCheck size={13} />Reviewed</span>}</p>
            <div className={`grid gap-2 ${ev.length === 1 ? "grid-cols-1 sm:max-w-md" : "grid-cols-2 sm:grid-cols-3"}`}>
              {ev.map((e) => <MediaTile key={e.id} ev={e} resolve={resolve} onOpen={(x, url) => onOpenMedia({ ev: x, url })} badge={e.st === "approved" ? (e.audience === "moderators" ? ["Moderators only", "#3B3FD8"] : null) : e.st === "rejected" ? ["Rejected", "#E5484D"] : ["Pending review", "#B45309"]} />)}
            </div>
          </div>
        );
      })()}
      {response?.text && (
        <div className="mt-4 rounded-2xl border-l-4 border-leaf bg-leaf/[0.07] p-4">
          <p className="flex items-center gap-1.5 text-[12.5px] font-bold text-leaf"><ShieldCheck size={14} />Official response{response.at ? ` · ${timeAgo(response.at)}` : ""}</p>
          <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed">{response.text}</p>
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t hair pt-4">
        <span className="mr-auto flex items-center gap-2 text-[12.5px] text-mute">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-raised">{p.anon || !name ? <ShieldCheck size={14} className="text-leaf" /> : <User size={14} />}</span>
          {p.anon ? "Citizen" : name || (p.sample ? "Community" : "Member")} · {timeAgo(p.createdAt)}
        </span>
        <a href={mapsUrl(p.entity, [p.city, p.district, p.state].filter(Boolean).join(", "))} target="_blank" rel="noopener noreferrer" className="focusable inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-mute hover:bg-raised"><MapPin size={14} />Map</a>
        {p.type === "issue" && <button onClick={() => onChannel(p.cat)} className="focusable inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold text-leaf hover:bg-leaf/10"><Landmark size={14} />Official channel</button>}
        {isAdmin && (
          <label className="flex items-center gap-1.5 text-[12px] text-mute"><span className="sr-only">Status</span>
            <select value={st} onChange={(e) => onStatus(p.id, e.target.value)} className="focusable h-9 rounded-full border hair2 bg-raised px-3 text-[12.5px] font-semibold">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
          </label>
        )}
        <button onClick={() => onToggle("flags", p.id)} aria-pressed={flagged} className={`focusable inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold transition ${flagged ? "bg-ruby/10 text-ruby" : "text-mute hover:bg-raised"}`} title="Report for review"><Flag size={14} />{flagged ? "Reported" : "Report"}</button>
        <motion.button whileTap={{ scale: 0.92 }} onClick={() => onToggle("metoo", p.id)} aria-pressed={mine} className={`focusable inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-bold transition ${mine ? "bg-indigo text-white" : "bg-indigo/10 text-indigo hover:bg-indigo/15"}`}><ThumbsUp size={15} className={mine ? "fill-white" : ""} />Me too<span className="tab">{metoo || 0}</span></motion.button>
      </div>
    </motion.article>
  );
}

/* ---------------- Legal, moderation, login ---------------- */
function Sheet({ title, onClose, children, wide }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div role="dialog" aria-label={title} initial={{ y: 30 }} animate={{ y: 0 }} exit={{ y: 30 }} onMouseDown={(e) => e.stopPropagation()} className={`flex max-h-[92vh] w-full ${wide ? "max-w-4xl" : "max-w-2xl"} flex-col overflow-hidden rounded-t-[28px] bg-card shadow-2xl sm:rounded-[28px]`} style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <header className="flex items-center justify-between border-b hair px-6 py-4"><h2 className="font-display text-[22px] font-bold tracking-[-0.02em]">{title}</h2><button onClick={onClose} className="focusable rounded-full p-2 text-mute" aria-label="Close"><X size={20} /></button></header>
        <div className="overflow-y-auto px-6 py-6">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function LegalSheet({ page, setPage, onClose }) {
  const d = LEGAL[page];
  return (
    <Sheet title="Legal" onClose={onClose}>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">{Object.entries(LEGAL).map(([k, v]) => <button key={k} role="tab" aria-selected={page === k} onClick={() => setPage(k)} className={`focusable rounded-full px-4 py-2 text-[13.5px] font-semibold ${page === k ? "bg-ink text-bg" : "bg-raised text-mute"}`}>{v.title}</button>)}</div>
      <p className="mb-6 rounded-2xl bg-sun/15 p-4 text-[13px]">Template text. Complete the bracketed details and have it reviewed by a lawyer before public launch.</p>
      <h3 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">{d.title}</h3>
      <div className="mt-4 space-y-5">{d.sections.map(([h, t]) => <section key={h}><h4 className="text-[15.5px] font-bold">{h}</h4><p className="mt-1.5 text-[14.5px] leading-relaxed text-ink/85">{t}</p></section>)}</div>
    </Sheet>
  );
}

function ModerationSheet({ posts, votes, status, hidden, responses, store, onClose, evStatus, onOpenMedia }) {
  const [tab, setTab] = useState("evidence");
  const [drafts, setDrafts] = useState({});
  const pendingEv = posts.flatMap((p) => (p.evidence || []).map((e) => ({ ...e, post: p }))).filter((e) => !evStatus[e.id]);
  const list = [...posts].filter((p) => tab === "all" || (tab === "reported" ? (votes.flags[p.id] || 0) > 0 : tab === "hidden" ? hidden[p.id] : (status[p.id] || "Open") !== "Resolved"))
    .sort((a, b) => (votes.flags[b.id] || 0) - (votes.flags[a.id] || 0) || new Date(b.createdAt) - new Date(a.createdAt));
  const counts = { evidence: pendingEv.length, reported: posts.filter((p) => (votes.flags[p.id] || 0) > 0).length, open: posts.filter((p) => (status[p.id] || "Open") !== "Resolved").length, hidden: posts.filter((p) => hidden[p.id]).length, all: posts.length };
  return (
    <Sheet title="Moderation dashboard" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[["evidence", "Evidence to review", Camera, "#B45309"], ["reported", "Reported", Flag, "#E5484D"], ["open", "Not resolved", Activity, "#FF7A2F"], ["hidden", "Hidden", EyeOff, "#3B3FD8"], ["all", "All posts", MessageSquare, "#13A86B"]].map(([k, l, I, c]) => (
          <button key={k} onClick={() => setTab(k)} aria-pressed={tab === k} className={`focusable rounded-2xl border p-4 text-left transition ${tab === k ? "border-transparent bg-ink text-bg" : "hair2"}`}><I size={18} style={{ color: tab === k ? undefined : c }} /><p className="tab mt-2 font-display text-[28px] font-extrabold leading-none">{counts[k]}</p><p className={`mt-1 text-[12.5px] ${tab === k ? "opacity-80" : "text-mute"}`}>{l}</p></button>
        ))}
      </div>
      {tab === "evidence" ? (
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {pendingEv.map((e) => (
            <li key={e.id} className="rounded-2xl border hair p-3">
              <MediaTile ev={e} resolve={store.mediaUrl} onOpen={(x, url) => onOpenMedia({ ev: x, url })} badge={[e.audience === "moderators" ? "Moderators only" : "Public after review", "#3B3FD8"]} />
              <p className="mt-2 text-[13.5px] font-semibold">{e.post.title}</p>
              <p className="text-[12px] text-mute">{e.post.entity} · {[e.post.city, e.post.district, e.post.state].filter(Boolean).join(", ")}</p>
              <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-faint" title={e.sha256}><Fingerprint size={12} className="shrink-0" />{e.sha256?.slice(0, 24)}…{e.blurred ? ` · ${e.blurred} area${e.blurred > 1 ? "s" : ""} blurred` : ""}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => store.setEvidenceStatus(e.id, "approved", evStatus, e.post.id)} className="focusable inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-leaf/10 text-[12.5px] font-bold text-leaf"><Check size={14} />Approve</button>
                <button onClick={() => store.setEvidenceStatus(e.id, "rejected", evStatus, e.post.id)} className="focusable inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-ruby/10 text-[12.5px] font-bold text-ruby"><X size={14} />Reject</button>
              </div>
            </li>
          ))}
          {!pendingEv.length && <li className="rounded-2xl bg-raised p-8 text-center text-[14px] text-mute sm:col-span-2">No evidence waiting for review.</li>}
        </ul>
      ) : (
      <ul className="mt-6 space-y-3">
        {list.map((p) => (
          <li key={p.id} className="rounded-2xl border hair p-4">
            <div className="flex flex-wrap items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: catById(p.cat).color }}><CatIcon id={p.cat} size={16} /></span>
              <div className="min-w-0 flex-1"><p className="text-[14.5px] font-semibold">{p.title}</p><p className="text-[12.5px] text-mute">{p.entity} · {[p.city, p.district, p.state].filter(Boolean).join(", ")} · {timeAgo(p.createdAt)}</p></div>
              <span className="inline-flex items-center gap-1 rounded-full bg-ruby/10 px-2.5 py-1 text-[12px] font-bold text-ruby"><Flag size={12} />{votes.flags[p.id] || 0}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo/10 px-2.5 py-1 text-[12px] font-bold text-indigo"><ThumbsUp size={12} />{votes.metoo[p.id] || 0}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-[13.5px] text-ink/80">{p.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`ms-${p.id}`}>Status</label>
              <select id={`ms-${p.id}`} value={status[p.id] || "Open"} onChange={(e) => store.setStatus(p.id, e.target.value, status)} className="focusable h-9 rounded-full border hair2 bg-raised px-3 text-[12.5px] font-semibold">{STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
              <button onClick={() => store.setHidden(p.id, !hidden[p.id], hidden)} className={`focusable inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold ${hidden[p.id] ? "bg-leaf/10 text-leaf" : "bg-ruby/10 text-ruby"}`}>{hidden[p.id] ? <><Eye size={14} />Restore</> : <><EyeOff size={14} />Hide</>}</button>
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor={`mr-${p.id}`}>Official response</label>
              <input id={`mr-${p.id}`} value={drafts[p.id] ?? responses[p.id]?.text ?? ""} onChange={(e) => setDrafts({ ...drafts, [p.id]: e.target.value })} placeholder="Add an official response shown on the post" className="focusable h-10 flex-1 rounded-full border hair2 bg-raised px-4 text-[13.5px] outline-none" />
              <button onClick={() => drafts[p.id] !== undefined && store.respond(p.id, drafts[p.id].trim(), responses)} className="focusable inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-bold text-bg"><Gavel size={14} />Save response</button>
            </div>
          </li>
        ))}
        {!list.length && <li className="rounded-2xl bg-raised p-8 text-center text-[14px] text-mute">Nothing to review here.</li>}
      </ul>
      )}
      <p className="mt-5 text-[12px] text-faint">Before approving evidence, check for faces of bystanders or children, intimate or graphic content, and personal documents. Reject anything that should not be public.</p>
      <p className="mt-5 text-[12px] text-faint">IT Rules 2021: acknowledge complaints within 24 hours and resolve within 15 days; act on intimate imagery and impersonation reports within 24 hours.</p>
    </Sheet>
  );
}

const PROVIDERS = [
  { id: "google", label: "Continue with Google", note: "Gmail and Google accounts", icon: Mail },
  { id: "facebook", label: "Continue with Facebook", note: "Also for Instagram users (same Meta account)", icon: Users },
  { id: "linkedin", label: "Continue with LinkedIn", note: "Professional account", icon: Briefcase },
];

function SignInSheet({ auth, onClose, onSignedIn, initial = "signup" }) {
  const [kind, setKind] = useState(initial);
  const up = kind === "signup";
  const [mode, setMode] = useState("choose");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const digits = phone.replace(/\D/g, "").slice(-10);
  const full = `+91${digits}`;
  const run = async (key, fn) => { setErr(""); setBusy(key); try { await fn(); } catch (e) { setErr(e?.message || "Something went wrong. Please try again."); } setBusy(""); };
  const oauth = (id) => run(id, async () => { await auth.oauth(id); if (auth.preview) onSignedIn(); });
  const input = "focusable h-12 w-full rounded-2xl border hair2 bg-raised px-4 text-[15px] outline-none focus:border-indigo";
  const btn = "focusable flex h-12 w-full items-center gap-3 rounded-2xl border hair2 bg-card px-4 text-left text-[14.5px] font-semibold transition hover:bg-raised disabled:opacity-60";
  return (
    <Sheet title={up ? "Create your account" : "Welcome back"} onClose={onClose}>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-raised p-1" role="tablist" aria-label="Sign up or sign in">
        {[["signup", "Sign up"], ["signin", "Sign in"]].map(([k, l]) => <button key={k} role="tab" aria-selected={kind === k} onClick={() => { setKind(k); setMode("choose"); setErr(""); setCode(""); }} className={`focusable h-11 rounded-xl text-[14.5px] font-bold transition ${kind === k ? "bg-card shadow" : "text-mute"}`}>{l}</button>)}
      </div>
      <p className="-mt-1 mb-4 text-[13.5px] text-mute">{up ? "Join in seconds and start raising your voice. You will add your name, gender and age next." : "Sign in with the same method you used to sign up."}</p>
      {auth.preview && <p className="mb-4 rounded-2xl bg-sun/15 p-3 text-[12.5px]">Preview: buttons demonstrate the flow using your current account. On www.oneyouthoneindia.com they open the real Google, Facebook or LinkedIn sign in, and send real codes by email or SMS.</p>}
      {mode === "choose" && (
        <div className="space-y-2.5">
          {PROVIDERS.map((p) => (
            <button key={p.id} onClick={() => oauth(p.id)} disabled={!!busy} className={btn}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-raised"><p.icon size={17} className="text-indigo" /></span>
              <span className="flex-1"><span className="block">{up ? p.label.replace("Continue", "Sign up") : p.label.replace("Continue", "Sign in")}</span><span className="block text-[12px] font-normal text-mute">{p.note}</span></span>
              {busy === p.id ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} className="text-faint" />}
            </button>
          ))}
          <div className="flex items-center gap-3 py-1 text-[12px] text-faint"><span className="h-px flex-1 bg-line/10" />or get a one time code<span className="h-px flex-1 bg-line/10" /></div>
          <button onClick={() => setMode("email")} className={btn}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-raised"><AtSign size={17} className="text-saffron" /></span><span className="flex-1"><span className="block">{up ? "Sign up" : "Sign in"} with email</span><span className="block text-[12px] font-normal text-mute">Yahoo Mail, Rediffmail, Outlook or any email</span></span><ArrowRight size={16} className="text-faint" /></button>
          <button onClick={() => setMode("phone")} className={btn}><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-raised"><Smartphone size={17} className="text-leaf" /></span><span className="flex-1"><span className="block">{up ? "Sign up" : "Sign in"} with mobile OTP</span><span className="block text-[12px] font-normal text-mute">Indian mobile number, +91</span></span><ArrowRight size={16} className="text-faint" /></button>
          <p className="pt-2 text-center text-[13px] text-mute">{up ? "Already have an account? " : "New to One Youth One India? "}<button onClick={() => setKind(up ? "signin" : "signup")} className="focusable rounded font-bold text-indigo">{up ? "Sign in" : "Sign up"}</button></p>
          <p className="pt-1 text-[12px] text-mute">By continuing you agree to the Terms of Use and Privacy Policy. Instagram does not offer sign in for websites, so Instagram users can continue with Facebook.</p>
        </div>
      )}
      {(mode === "email" || mode === "phone") && (
        <div className="space-y-4">
          <button onClick={() => { setMode("choose"); setErr(""); setCode(""); }} className="focusable inline-flex items-center gap-1.5 rounded text-[13px] font-semibold text-indigo"><ArrowRight size={14} className="rotate-180" />All sign in options</button>
          {mode === "email" ? (
            <div><label htmlFor="si-e" className="mb-1.5 block text-[13px] font-semibold">Email address</label><input id="si-e" type="email" autoComplete="email" className={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yahoo.com, you@rediffmail.com" /></div>
          ) : (
            <div><label htmlFor="si-p" className="mb-1.5 block text-[13px] font-semibold">Mobile number</label><div className="flex gap-2"><span className="flex h-12 items-center rounded-2xl bg-raised px-4 text-[15px] font-semibold">+91</span><input id="si-p" inputMode="numeric" autoComplete="tel-national" className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10 digit mobile number" /></div></div>
          )}
          <button onClick={() => run("send", async () => {
            if (mode === "email") { if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Enter a valid email address"); await auth.sendEmailOtp(email.trim(), up); }
            else { if (!/^[6-9]\d{9}$/.test(digits)) throw new Error("Enter a valid 10 digit mobile number"); await auth.sendOtp(full, up); }
            setMode(mode + "-code");
          })} disabled={!!busy} className="focusable flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo text-[15px] font-bold text-white disabled:opacity-60">{busy === "send" ? <Loader2 size={18} className="animate-spin" /> : "Send code"}</button>
        </div>
      )}
      {(mode === "email-code" || mode === "phone-code") && (
        <div className="space-y-4">
          <p className="text-[14.5px]">Enter the 6 digit code sent to <b>{mode === "email-code" ? email : full}</b>.{auth.preview && " (Preview: any 6 digits work.)"}</p>
          <label htmlFor="si-c" className="sr-only">One time code</label>
          <input id="si-c" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className={`${input} tab text-center text-[22px] tracking-[0.4em]`} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
          <button onClick={() => run("verify", async () => { if (mode === "email-code") await auth.verifyEmailOtp(email.trim(), code); else await auth.verifyOtp(full, code); if (auth.preview) onSignedIn(); })} disabled={!!busy || code.length < 6} className="focusable flex h-12 w-full items-center justify-center gap-2 rounded-full bg-indigo text-[15px] font-bold text-white disabled:opacity-60">{busy === "verify" ? <Loader2 size={18} className="animate-spin" /> : up ? "Verify and create account" : "Verify and sign in"}</button>
          <button onClick={() => setMode(mode === "email-code" ? "email" : "phone")} className="focusable w-full rounded text-[13px] font-semibold text-indigo">Change {mode === "email-code" ? "email" : "number"}</button>
        </div>
      )}
      {err && <p className="mt-3 text-[13px] text-ruby" role="alert">{err}</p>}
    </Sheet>
  );
}

const GENDERS = ["Female", "Male", "Non-binary", "Other", "Prefer not to say"];
function ProfileSheet({ store, initial, onClose, onSaved, onSignOut, firstTime }) {
  const [f, setF] = useState({ displayName: initial?.displayName || "", fullName: initial?.fullName || "", gender: initial?.gender || "", age: initial?.age ? String(initial.age) : "" });
  const [agree, setAgree] = useState(!!initial?.completed);
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const input = "focusable h-12 w-full rounded-2xl border hair2 bg-raised px-4 text-[15px] outline-none focus:border-indigo";
  const save = async () => {
    const e = {}; const age = parseInt(f.age, 10);
    if (f.displayName.trim().length < 2) e.displayName = "Choose a display name of at least 2 characters";
    if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!f.gender) e.gender = "Choose an option";
    if (!age || age < 1 || age > 120) e.age = "Enter your age";
    else if (age < 18) e.age = "One Youth One India is for people aged 18 and above. A parent or guardian can post on your behalf.";
    if (!agree) e.agree = "Please confirm to continue";
    setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    try { const p = { displayName: f.displayName.trim(), fullName: f.fullName.trim(), gender: f.gender, age }; await store.saveProfile(p); onSaved({ ...p, completed: true }); }
    catch (x) { setErr({ save: x?.message || "Could not save. Please try again." }); }
    setBusy(false);
  };
  return (
    <Sheet title={firstTime ? "Complete your profile" : "My profile"} onClose={onClose}>
      <div className="flex items-center gap-4 rounded-2xl bg-raised p-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-saffron via-indigo to-leaf font-display text-[22px] font-extrabold text-white">{(f.displayName || "?").trim().charAt(0).toUpperCase()}</span>
        <div className="min-w-0"><p className="truncate font-display text-[19px] font-bold">{f.displayName || "Your display name"}</p><p className="text-[12.5px] text-mute">{store?.auth?.method ? `Signed in with ${store.auth.method}` : "Signed in"}</p></div>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Display name (shown on public posts)" id="pf-d" error={err.displayName}><input id="pf-d" className={input} value={f.displayName} onChange={(e) => { setF({ ...f, displayName: e.target.value }); setErr((x) => ({ ...x, displayName: undefined })); }} maxLength={40} placeholder="e.g. Ravi K" /></Field></div>
        <div className="sm:col-span-2"><Field label="Full name (private)" id="pf-f" error={err.fullName}><input id="pf-f" className={input} value={f.fullName} onChange={(e) => { setF({ ...f, fullName: e.target.value }); setErr((x) => ({ ...x, fullName: undefined })); }} maxLength={120} autoComplete="name" placeholder="As on your ID" /></Field></div>
        <Field label="Gender (private)" id="pf-g" error={err.gender}><select id="pf-g" className={input} value={f.gender} onChange={(e) => { setF({ ...f, gender: e.target.value }); setErr((x) => ({ ...x, gender: undefined })); }}><option value="">Choose</option>{GENDERS.map((g) => <option key={g}>{g}</option>)}</select></Field>
        <Field label="Age (private)" id="pf-a" error={err.age}><input id="pf-a" inputMode="numeric" className={input} value={f.age} onChange={(e) => { setF({ ...f, age: e.target.value.replace(/\D/g, "").slice(0, 3) }); setErr((x) => ({ ...x, age: undefined })); }} placeholder="Years" /></Field>
      </div>
      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-indigo/[0.06] p-3 text-[12.5px] text-mute"><Lock size={15} className="mt-0.5 shrink-0 text-indigo" />Only your display name is public. Full name, gender and age are private, used to keep the platform genuine and to understand who is being heard. You can update or delete them any time.</p>
      <label className="mt-4 flex cursor-pointer items-start gap-3 text-[13.5px]"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-indigo" />I am 18 or older and agree to the Terms of Use and Privacy Policy.</label>
      {err.agree && <p className="mt-1 text-[12.5px] text-ruby">{err.agree}</p>}
      {err.save && <p className="mt-2 text-[12.5px] text-ruby" role="alert">{err.save}</p>}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button onClick={onSignOut} className="focusable inline-flex items-center gap-1.5 rounded text-[13.5px] font-semibold text-mute hover:text-ink"><LogOut size={15} />Sign out</button>
        <button onClick={save} disabled={busy} className="focusable inline-flex h-12 items-center gap-2 rounded-full bg-indigo px-6 text-[15px] font-bold text-white disabled:opacity-60">{busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}Save profile</button>
      </div>
    </Sheet>
  );
}

/* ---------------- Help near you ---------------- */
function HelpNearYou() {
  const [st, setSt] = useState("Karnataka");
  const [di, setDi] = useState("");
  const [th, setTh] = useState("");
  const place = [th, di, st].filter(Boolean).join(", ");
  const sel = "focusable h-12 w-full rounded-2xl border hair2 bg-card px-4 text-[14.5px] font-semibold";
  const Fi = { Siren, HeartPulse, Flame, Landmark, FileText, Building2, Mail, Wheat };
  return (
    <section id="help" className="scroll-mt-20 border-t hair">
      <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="inline-flex items-center gap-2 rounded-full bg-ruby/10 px-3 py-1 text-[13px] font-bold text-ruby"><Siren size={14} />Help near you</p><h2 className="mt-3 font-display text-[34px] font-extrabold tracking-[-0.03em] md:text-[44px]">Helplines, police and hospitals for every district</h2><p className="mt-2 max-w-2xl text-[15px] text-mute">Choose your district to call the right helpline or open live Google Maps listings with addresses, phone numbers and directions.</p></div>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-3">
          <div><label htmlFor="h-s" className="mb-1.5 block text-[13px] font-semibold">State or union territory</label><select id="h-s" className={sel} value={st} onChange={(e) => { setSt(e.target.value); setDi(""); setTh(""); }}>{STATES.map((x) => <option key={x}>{x}</option>)}</select></div>
          <div><label htmlFor="h-d" className="mb-1.5 block text-[13px] font-semibold">District</label><select id="h-d" className={sel} value={di} onChange={(e) => { setDi(e.target.value); setTh(""); }}><option value="">All of {st}</option>{districtsOf(st).map((d) => <option key={d.code}>{d.name}</option>)}</select></div>
          <div><label htmlFor="h-t" className="mb-1.5 block text-[13px] font-semibold">Tehsil (optional)</label><select id="h-t" className={sel} value={th} onChange={(e) => setTh(e.target.value)} disabled={!di}><option value="">{di ? `All of ${di}` : "Choose district first"}</option>{tehsilsOf(st, di).map((t) => <option key={t}>{t}</option>)}</select></div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="rounded-[28px] border hair bg-card p-5 md:p-6 lg:col-span-5">
            <p className="font-display text-[20px] font-bold">Call for help</p>
            <p className="mt-1 text-[13px] text-mute">Toll free from any phone. Calls route to the control room for {di || st}.</p>
            <a href={`tel:${HELPLINES[0].n}`} className="focusable mt-4 flex items-center gap-4 rounded-2xl bg-ruby p-4 text-white"><span className="font-display text-[40px] font-extrabold leading-none">112</span><span className="flex-1 text-[14px] font-semibold leading-snug">{HELPLINES[0].label}</span><Phone size={22} /></a>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {HELPLINES.slice(1).map((h) => (
                <li key={h.n}><a href={`tel:${h.n}`} className="focusable flex items-center gap-3 rounded-2xl border hair p-3 transition hover:bg-raised"><span className="tab min-w-[56px] font-display text-[20px] font-extrabold text-ink">{h.n}</span><span className="flex-1 text-[12.5px] leading-snug text-mute">{h.label}</span><Phone size={15} className="shrink-0 text-leaf" /></a></li>
              ))}
            </ul>
          </div>
          <div className="lg:col-span-7">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-deep via-indigo to-[#0E7C5A] p-6 text-white md:p-8">
              <svg className="absolute inset-0 h-full w-full opacity-15" aria-hidden="true"><defs><pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="white" strokeWidth=".6" /></pattern></defs><rect width="100%" height="100%" fill="url(#g)" /><path d="M-20 160 C 120 80, 240 220, 420 120 S 700 60, 900 160" fill="none" stroke="white" strokeWidth="3" /><path d="M120 -10 C 160 120, 90 220, 200 340" fill="none" stroke="white" strokeWidth="2" /></svg>
              <div className="relative">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-white/80"><MapPin size={15} />{place}</p>
                <p className="mt-2 font-display text-[26px] font-bold leading-tight md:text-[30px]">Find services on Google Maps</p>
                <p className="mt-1 text-[13.5px] text-white/75">Opens live listings with phone numbers, timings and directions.</p>
                <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MAP_FINDERS.map((m) => { const I = Fi[m.icon] || MapPin; return (
                    <a key={m.q} href={mapsUrl(m.q, place)} target="_blank" rel="noopener noreferrer" className="focusable flex items-center gap-2.5 rounded-2xl bg-white/12 p-3 text-[13.5px] font-semibold backdrop-blur transition hover:bg-white/20" style={{ background: "rgba(255,255,255,0.12)" }}><I size={17} className="shrink-0" />{m.label}<ExternalLink size={13} className="ml-auto shrink-0 opacity-70" /></a>
                  ); })}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={mapsUrl("police station")} target="_blank" rel="noopener noreferrer" className="focusable inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[14px] font-bold text-indigo-deep"><LocateFixed size={16} />Nearest police station to me</a>
                  <a href={mapsUrl("hospital")} target="_blank" rel="noopener noreferrer" className="focusable inline-flex h-11 items-center gap-2 rounded-full bg-white/15 px-5 text-[14px] font-bold text-white"><Navigation size={16} />Nearest hospital</a>
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <a href={searchUrl(`${di || st} district official website helpline numbers`)} target="_blank" rel="noopener noreferrer" className="focusable flex items-center gap-3 rounded-2xl border hair bg-card p-4 hover:bg-raised"><Landmark size={18} className="shrink-0 text-indigo" /><span className="flex-1"><span className="block text-[14px] font-semibold">{di ? `${di} district` : st} official helpline page</span><span className="text-[12.5px] text-mute">District sites list collectorate and taluk office numbers</span></span><ExternalLink size={15} className="text-mute" /></a>
              <a href="https://digitalpolice.gov.in" target="_blank" rel="noopener noreferrer" className="focusable flex items-center gap-3 rounded-2xl border hair bg-card p-4 hover:bg-raised"><ShieldCheck size={18} className="shrink-0 text-indigo" /><span className="flex-1"><span className="block text-[14px] font-semibold">Digital Police portal</span><span className="text-[12.5px] text-mute">Online police services and complaints (NCRB)</span></span><ExternalLink size={15} className="text-mute" /></a>
            </div>
            <p className="mt-3 text-[12px] text-faint">Police station numbers change often, so they come live from Google Maps and official district websites rather than a fixed list. In danger, always call 112.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- App ---------------- */
export default function App() {
  const [store, setStore] = useState(null);
  const [posts, setPosts] = useState([]);
  const [votes, setVotes] = useState({ metoo: {}, flags: {}, mine: { metoo: [], flags: [] } });
  const [status, setStatus] = useState({});
  const [priv, setPriv] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [cat, setCat] = useState("all");
  const [state, setState] = useState("all");
  const [district, setDistrict] = useState("all");
  const [sort, setSort] = useState("latest");
  const [composer, setComposer] = useState(false);
  const [mine, setMine] = useState(false);
  const [channel, setChannel] = useState(null);
  const [hidden, setHidden] = useState({});
  const [responses, setResponses] = useState({});
  const [modOpen, setModOpen] = useState(false);
  const [legal, setLegal] = useState(null);
  const [login, setLogin] = useState(false); // false | "signup" | "signin"
  const [evStatus, setEvStatus] = useState({});
  const [authTick, setAuthTick] = useState(0);
  const [profile, setProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [allCats, setAllCats] = useState(false);
  const [ai, setAi] = useState({ busy: false, text: "" });
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("oyoi-theme") || ""; } catch { return ""; } });
  const exploreRef = useRef();
  const isDark = theme ? theme === "dark" : typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;

  useEffect(() => { if (theme) document.documentElement.dataset.theme = theme; try { theme && localStorage.setItem("oyoi-theme", theme); } catch { /* ignore */ } }, [theme]);
  useEffect(() => {
    let unsub = () => {};
    connect().then((s) => {
      setStore(s);
      unsub = s.subscribe({ onPosts: (p) => { setPosts(p); setLoading(false); }, onVotes: setVotes, onStatus: setStatus, onPrivate: setPriv, onHidden: setHidden, onResponses: setResponses, onEvidence: setEvStatus, onError: () => setLoading(false) });
      setTimeout(() => setLoading(false), 2500);
      if (s.auth?.signedIn) s.getProfile?.().then((p) => { setProfile(p); if (!p?.completed) setProfileOpen(true); }).catch(() => {});
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    if (!store) return;
    const ids = [...new Set(posts.filter((p) => p.authorId && !p.anon).map((p) => p.authorId))];
    if (ids.length) store.names(ids).then(setNames);
  }, [posts, store]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    let l = posts.filter((p) => (store?.isAdmin || !hidden[p.id]) && (type === "all" || p.type === type) && (cat === "all" || catById(p.cat).id === cat) && (state === "all" || String(p.state).toLowerCase() === state.toLowerCase()) && (district === "all" || p.district === district) && (!t || `${p.title} ${p.body} ${p.entity} ${p.city} ${p.state} ${p.sub || ""} ${catById(p.cat).name}`.toLowerCase().includes(t)));
    const m = (p) => votes.metoo[p.id] || 0;
    l = [...l].sort(sort === "support" ? (a, b) => m(b) - m(a) : sort === "best" ? (a, b) => (b.rating || 0) - (a.rating || 0) : sort === "worst" ? (a, b) => (a.rating || 9) - (b.rating || 9) : (a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return l;
  }, [posts, q, type, cat, state, district, sort, votes, hidden, store]);

  const stats = useMemo(() => {
    const issues = posts.filter((p) => p.type === "issue");
    const resolved = issues.filter((p) => status[p.id] === "Resolved").length;
    const cities = new Set(posts.map((p) => `${p.city}|${p.state}`)).size;
    const support = Object.values(votes.metoo).reduce((s, v) => s + v, 0);
    return { voices: posts.length, resolved, issues: issues.length, cities, support };
  }, [posts, status, votes]);

  const byState = useMemo(() => { const m = {}; posts.forEach((p) => (m[p.state] = (m[p.state] || 0) + 1)); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 7); }, [posts]);
  const trending = useMemo(() => { const m = {}; posts.forEach((p) => { const k = `${p.entity}|${p.city}`; m[k] = m[k] || { entity: p.entity, city: p.city, cat: p.cat, n: 0, s: 0 }; m[k].n += 1; m[k].s += votes.metoo[p.id] || 0; }); return Object.values(m).sort((a, b) => b.s + b.n - (a.s + a.n)).slice(0, 5); }, [posts, votes]);
  const catCount = useMemo(() => { const m = {}; posts.forEach((p) => { const id = catById(p.cat).id; m[id] = (m[id] || 0) + 1; }); return m; }, [posts]);
  const latest = useMemo(() => [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 12), [posts]);

  const summarise = async () => {
    if (!store?.sample) return;
    setAi({ busy: true, text: "" });
    const rows = filtered.slice(0, 40).map((p) => ({ type: p.type, category: catById(p.cat).name, place: p.entity, city: p.city, state: p.state, rating: p.rating, severity: p.severity, status: status[p.id] || "Open", metoo: votes.metoo[p.id] || 0, title: p.title }));
    try {
      await store.sample(`You summarise citizen feedback for an Indian public review platform. Using ONLY the JSON below, write 3 to 5 short bullet points (start each with "• ") about the most supported problems, places doing well, and what authorities should act on first. Be factual and neutral, never name private individuals, and do not invent anything not in the data.\n\n${JSON.stringify(rows)}`, { onText: ({ text }) => setAi({ busy: true, text }), cache: false });
      setAi((s) => ({ ...s, busy: false }));
    } catch (e) { setAi({ busy: false, text: e?.code === "not_granted" ? "" : "Could not create a summary right now." }); }
  };

  const signedIn = !!store?.auth?.signedIn; // eslint-disable-line no-unused-vars
  const requireAccount = store?.auth && !store.auth.preview;
  const openComposer = () => (requireAccount && !signedIn ? setLogin("signup") : requireAccount && !profile?.completed ? setProfileOpen(true) : setComposer(true));
  const afterSignIn = async () => { setLogin(false); setAuthTick((t) => t + 1); const p = await store.getProfile?.().catch(() => null); setProfile(p); setProfileOpen(true); };
  const signOut = async () => { await store?.auth?.signOut(); setProfile(null); setProfileOpen(false); setAuthTick((t) => t + 1); };
  const goExplore = () => exploreRef.current?.scrollIntoView({ behavior: "smooth" });
  const pick = (c) => { setCat(c); goExplore(); };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b hair bg-bg/80 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-3 sm:gap-4 sm:px-4 md:px-6">
          <a href="#top" className="focusable rounded-lg" aria-label="One Youth One India home"><Logo /></a>
          <nav className="ml-2 hidden gap-0 xl:flex" aria-label="Main">
            {[["Explore", "#explore"], ["Help near you", "#help"], ["Official channels", "#channels"]].map(([l, h]) => <a key={l} href={h} className="focusable whitespace-nowrap rounded-full px-2.5 py-2 text-[14px] font-medium text-mute hover:bg-raised hover:text-ink">{l}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <a href="tel:112" className="focusable inline-flex h-10 items-center gap-1 rounded-full bg-ruby px-2.5 sm:gap-1.5 sm:px-3 text-[13px] font-extrabold text-white" aria-label="Call emergency 112"><Phone size={15} />112</a>
            {store?.isAdmin && <button onClick={() => setModOpen(true)} className="focusable hidden h-10 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[14px] font-medium text-mute hover:bg-raised hover:text-ink md:inline-flex" aria-label="Moderation" title="Moderation dashboard"><Gavel size={17} />{Object.keys(votes.flags).length > 0 && <span className="rounded-full bg-ruby px-1.5 text-[11px] font-bold text-white">{posts.filter((p) => votes.flags[p.id]).length}</span>}</button>}
            {store?.auth && (signedIn ? (
              <button onClick={() => setProfileOpen(true)} className="focusable inline-flex h-10 items-center gap-2 rounded-full pl-1 pr-1 text-[14px] font-semibold hover:bg-raised sm:pr-3" aria-label="My profile"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-saffron via-indigo to-leaf text-[13px] font-extrabold text-white">{(profile?.displayName || "?").charAt(0).toUpperCase()}</span><span className="hidden max-w-[110px] truncate lg:inline">{profile?.displayName || "Profile"}</span></button>
            ) : (
              <>
                <button onClick={() => setLogin("signin")} className="focusable hidden h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[14px] font-semibold text-ink hover:bg-raised md:inline-flex"><LogIn size={16} />Sign in</button>
                <button onClick={() => setLogin("signup")} className="focusable inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-indigo/30 bg-indigo/10 px-2.5 text-[14px] font-bold text-indigo hover:bg-indigo/15 sm:px-3" aria-label="Sign up"><UserRound size={16} /><span className="hidden sm:inline">Sign up</span></button>
              </>
            ))}
            <button onClick={() => setMine(true)} aria-label="My activity" title="My activity" className="focusable hidden h-10 items-center gap-2 whitespace-nowrap rounded-full px-3 text-[14px] font-medium text-mute hover:bg-raised hover:text-ink sm:inline-flex"><Inbox size={17} /></button>
            <button onClick={() => setTheme(isDark ? "light" : "dark")} className="focusable hidden rounded-full p-2.5 text-mute hover:bg-raised sm:inline-flex" aria-label="Toggle light and dark mode">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={openComposer} aria-label="Share your voice" className="focusable inline-flex h-10 items-center gap-2 rounded-full bg-ink px-3 text-[14px] font-bold text-bg sm:px-4"><Plus size={17} /><span className="hidden whitespace-nowrap sm:inline">Share your voice</span></button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-saffron/25 blur-[120px]" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-40 top-10 h-[520px] w-[520px] rounded-full bg-leaf/20 blur-[120px]" aria-hidden="true" />
        <div className="pointer-events-none absolute left-1/3 top-60 h-[420px] w-[420px] rounded-full bg-indigo/20 blur-[120px]" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1280px] gap-10 px-4 pb-14 pt-12 md:px-6 md:pb-20 md:pt-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 rounded-full border hair2 bg-card/70 px-3.5 py-1.5 text-[13px] font-semibold"><span className="relative flex h-2 w-2"><span className="absolute inset-0 animate-ping2 rounded-full bg-leaf" /><span className="relative h-2 w-2 rounded-full bg-leaf" /></span>Real time public feedback for every Indian</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-6 font-display text-[clamp(2.6rem,6.5vw,5.2rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
              Every voice.<br />Every service.<br /><span className="bg-gradient-to-r from-saffron via-indigo to-leaf bg-clip-text text-transparent">One India.</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6 max-w-xl text-[17px] leading-relaxed text-mute md:text-[19px]" data-cov="1">Review hospitals, schools, public services and products. Report potholes, water cuts and everyday problems. Rally support with Me too and track every issue until it is resolved.</motion.p>
            <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} onSubmit={(e) => { e.preventDefault(); goExplore(); }} className="mt-8 flex max-w-xl items-center gap-2 rounded-full border hair2 bg-card p-1.5 pl-5 shadow-[0_20px_60px_-30px_rgba(59,63,216,0.45)]">
              <Search size={19} className="shrink-0 text-faint" /><label htmlFor="hero-q" className="sr-only">Search</label>
              <input id="hero-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a hospital, school, road or city" className="h-11 min-w-0 flex-1 bg-transparent text-[15.5px] outline-none placeholder:text-faint" />
              <button className="focusable inline-flex h-11 items-center gap-2 rounded-full bg-indigo px-5 text-[14.5px] font-bold text-white">Search<ArrowRight size={16} /></button>
            </motion.form>
            <div className="mt-8 grid max-w-xl grid-cols-3 gap-3">
              {[["Voices shared", stats.voices], ["Me too support", stats.support], ["Cities", stats.cities]].map(([l, v]) => <div key={l} className="rounded-2xl border hair bg-card/70 p-4"><p className="tab font-display text-[30px] font-extrabold leading-none tracking-[-0.03em]">{v}</p><p className="mt-1.5 text-[12.5px] text-mute">{l}</p></div>)}
            </div>
            <p className="mt-4 flex max-w-xl items-start gap-2 text-[13px] text-mute"><MapPin size={15} className="mt-0.5 shrink-0 text-saffron" />Covers all {COVERAGE.states} states and union territories, {COVERAGE.districts.toLocaleString("en-IN")} districts, {COVERAGE.tehsils.toLocaleString("en-IN")} tehsils and {COVERAGE.cities.toLocaleString("en-IN")} cities and towns, down to your village.</p>
          </div>

          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-5">
            <div className="rounded-[28px] border hair bg-card p-5 shadow-[0_40px_100px_-40px_rgba(28,31,110,0.45)] md:p-6">
              <div className="flex items-center justify-between"><p className="flex items-center gap-2 font-display text-[18px] font-bold"><Activity size={18} className="text-saffron" />Live pulse</p><span className="flex items-center gap-1.5 rounded-full bg-leaf/10 px-2.5 py-1 text-[12px] font-bold text-leaf"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-leaf" />{store?.mode === "live" ? "Live" : "Preview"}</span></div>
              <ul className="mt-4 space-y-2.5">
                <AnimatePresence initial={false}>
                  {latest.slice(0, 5).map((p) => (
                    <motion.li key={p.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-2xl bg-raised p-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: catById(p.cat).color }}><CatIcon id={p.cat} size={18} /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{p.title}</span><span className="block truncate text-[12px] text-mute">{p.city}, {p.state} · {timeAgo(p.createdAt)}</span></span>
                      {p.type === "review" ? <span className="flex items-center gap-1 text-[13px] font-bold"><Star size={14} className="fill-sun text-sun" />{p.rating}</span> : <span className="text-[11.5px] font-bold" style={{ color: STATUS_TONE[status[p.id] || "Open"] }}>{status[p.id] || "Open"}</span>}
                    </motion.li>
                  ))}
                </AnimatePresence>
                {!latest.length && <li className="rounded-2xl bg-raised p-6 text-center text-[14px] text-mute">{loading ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Connecting</span> : "No voices yet. Be the first to share."}</li>}
              </ul>
              <button onClick={openComposer} className="focusable mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-saffron via-indigo to-leaf text-[15px] font-bold text-white"><Megaphone size={18} />Share your voice</button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ticker */}
      {latest.length > 2 && (
        <div className="border-y hair bg-card/60 py-3" aria-hidden="true">
          <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
            <div className="flex w-max animate-ticker gap-8 whitespace-nowrap">
              {[...latest, ...latest].map((p, i) => <span key={i} className="flex items-center gap-2 text-[13.5px] text-mute"><span className="h-2 w-2 rounded-full" style={{ background: catById(p.cat).color }} /><b className="text-ink">{p.entity}</b>{p.title}</span>)}
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-[1280px] px-4 py-14 md:px-6">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><h2 className="font-display text-[34px] font-extrabold tracking-[-0.03em] md:text-[44px]">What do you want to talk about?</h2><p className="mt-2 max-w-xl text-[15px] text-mute">{CATEGORIES.filter((c) => c.govt).length} government service categories, from central ministries to your gram panchayat, including corruption and bribery, plus products and shopping.</p></div><button onClick={() => setAllCats(!allCats)} className="focusable inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-full border hair2 bg-card px-5 text-[14px] font-semibold md:self-auto">{allCats ? "Show fewer" : `Show all ${CATEGORIES.length} categories`}<ChevronDown size={16} className={allCats ? "rotate-180 transition" : "transition"} /></button></div>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {(allCats ? CATEGORIES : CATEGORIES.slice(0, 10)).map((c, i) => (
            <motion.button key={c.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }} onClick={() => pick(c.id)} className="focusable group relative overflow-hidden rounded-3xl border hair bg-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-xl">
              <span className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-15 transition group-hover:scale-125" style={{ background: c.color }} aria-hidden="true" />
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-white" style={{ background: c.color }}><CatIcon id={c.id} size={22} /></span>
              <p className="mt-4 text-[15.5px] font-bold leading-tight">{c.name}</p>
              <p className="mt-1 text-[12.5px] text-mute">{c.hint}</p>
              {!c.govt && <p className="mt-1 text-[11.5px] font-semibold text-faint">Private sector</p>}
              <p className="mt-3 text-[12.5px] font-semibold" style={{ color: c.color }}>{catCount[c.id] || 0} voices</p>
            </motion.button>
          ))}
        </div>
      </section>

      <HelpNearYou />

      {/* Explore */}
      <section id="explore" ref={exploreRef} className="scroll-mt-20 border-t hair bg-raised/40">
        <div className="mx-auto max-w-[1280px] px-4 py-14 md:px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><h2 className="font-display text-[34px] font-extrabold tracking-[-0.03em] md:text-[44px]">Explore voices</h2><p className="mt-1 text-[15px] text-mute">{filtered.length} result{filtered.length === 1 ? "" : "s"}{cat !== "all" ? ` in ${catById(cat).name}` : ""}{state !== "all" ? ` · ${district !== "all" ? `${district}, ` : ""}${state}` : ""}</p></div>
            <div className="flex flex-wrap gap-2">
              <div className="flex rounded-full bg-card p-1 shadow-sm" role="tablist" aria-label="Type">{[["all", "All"], ["issue", "Issues"], ["review", "Reviews"]].map(([k, l]) => <button key={k} role="tab" aria-selected={type === k} onClick={() => setType(k)} className={`focusable rounded-full px-4 py-2 text-[13.5px] font-semibold transition ${type === k ? "bg-ink text-bg" : "text-mute"}`}>{l}</button>)}</div>
              <label className="sr-only" htmlFor="f-state">State</label>
              <select id="f-state" value={state} onChange={(e) => { setState(e.target.value); setDistrict("all"); }} className="focusable h-10 max-w-[180px] rounded-full border hair2 bg-card px-4 text-[13.5px] font-semibold"><option value="all">All states</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select>
              {state !== "all" && districtsOf(state).length > 0 && (<><label className="sr-only" htmlFor="f-dist">District</label><select id="f-dist" value={district} onChange={(e) => setDistrict(e.target.value)} className="focusable h-10 max-w-[180px] rounded-full border hair2 bg-card px-4 text-[13.5px] font-semibold"><option value="all">All districts</option>{districtsOf(state).map((d) => <option key={d.code}>{d.name}</option>)}</select></>)}
              <label className="sr-only" htmlFor="f-sort">Sort</label>
              <select id="f-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="focusable h-10 rounded-full border hair2 bg-card px-4 text-[13.5px] font-semibold"><option value="latest">Latest</option><option value="support">Most supported</option><option value="best">Highest rated</option><option value="worst">Lowest rated</option></select>
            </div>
          </div>
          <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCat("all")} aria-pressed={cat === "all"} className={`focusable shrink-0 rounded-full border px-4 py-2 text-[13px] font-semibold ${cat === "all" ? "border-transparent bg-ink text-bg" : "hair2 bg-card"}`}>All categories</button>
            {CATEGORIES.map((c) => <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id} className={`focusable inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold ${cat === c.id ? "border-transparent text-white" : "hair2 bg-card"}`} style={cat === c.id ? { background: c.color } : undefined}><CatIcon id={c.id} size={14} />{c.name}</button>)}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-8">
              <AnimatePresence mode="popLayout">
                {filtered.map((p) => <PostCard key={p.id} p={p} status={status[p.id]} metoo={votes.metoo[p.id]} mine={votes.mine.metoo.includes(p.id)} flagged={votes.mine.flags.includes(p.id)} isAdmin={store?.isAdmin} name={p.authorId ? names[p.authorId] : ""} onToggle={(k, id) => store?.toggle(k, id)} onStatus={(id, s) => store?.setStatus(id, s, status)} onChannel={setChannel} hidden={!!hidden[p.id]} response={responses[p.id]} evStatus={evStatus} resolve={store?.mediaUrl} me={store?.me} onOpenMedia={setLightbox} />)}
              </AnimatePresence>
              {!filtered.length && (
                <div className="rounded-3xl border border-dashed hair2 bg-card p-12 text-center">
                  <MessageSquare size={30} className="mx-auto text-faint" />
                  <p className="mt-3 font-display text-[22px] font-bold">{loading ? "Loading voices" : "Nothing here yet"}</p>
                  <p className="mt-1 text-[14.5px] text-mute">{loading ? "Connecting to the live feed." : "Try another filter, or be the first to share."}</p>
                  {!loading && <button onClick={openComposer} className="focusable mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-indigo px-5 text-[14px] font-bold text-white"><Plus size={16} />Share your voice</button>}
                </div>
              )}
            </div>
            <aside className="space-y-4 lg:col-span-4">
              <div className="rounded-3xl border hair bg-card p-5">
                <p className="flex items-center gap-2 font-display text-[18px] font-bold"><MapPin size={18} className="text-saffron" />India pulse</p>
                <p className="mt-1 text-[12.5px] text-mute">Voices by state</p>
                <ul className="mt-4 space-y-3">
                  {byState.map(([s, n]) => (
                    <li key={s}><button onClick={() => { setState(s); setDistrict("all"); }} className="focusable block w-full rounded-lg text-left"><div className="mb-1 flex justify-between text-[13px]"><span className="font-semibold">{s}</span><span className="tab text-mute">{n}</span></div><div className="h-2 overflow-hidden rounded-full bg-raised"><motion.div className="h-full rounded-full bg-gradient-to-r from-saffron via-indigo to-leaf" initial={{ width: 0 }} animate={{ width: `${(n / (byState[0]?.[1] || 1)) * 100}%` }} /></div></button></li>
                  ))}
                  {!byState.length && <li className="text-[13px] text-mute">No data yet.</li>}
                </ul>
              </div>
              <div className="rounded-3xl border hair bg-card p-5">
                <p className="flex items-center gap-2 font-display text-[18px] font-bold"><TrendingUp size={18} className="text-indigo" />Trending places</p>
                <ol className="mt-4 space-y-3">
                  {trending.map((t, i) => (
                    <li key={t.entity + t.city} className="flex items-center gap-3"><span className="tab w-5 text-[14px] font-bold text-faint">{i + 1}</span><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: catById(t.cat).color }}><CatIcon id={t.cat} size={16} /></span><span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{t.entity}</span><span className="text-[12px] text-mute">{t.city} · {t.n} voice{t.n > 1 ? "s" : ""} · {t.s} Me too</span></span></li>
                  ))}
                  {!trending.length && <li className="text-[13px] text-mute">No data yet.</li>}
                </ol>
              </div>
              {store?.sample && (
                <div className="rounded-3xl bg-gradient-to-br from-indigo-deep via-indigo to-[#0E7C5A] p-5 text-white">
                  <p className="flex items-center gap-2 font-display text-[18px] font-bold"><Sparkles size={18} />AI insight</p>
                  <p className="mt-1 text-[13px] text-white/75">Summarise what people are saying in the current view.</p>
                  {ai.text && <p className="mt-4 whitespace-pre-line rounded-2xl bg-white/10 p-4 text-[13.5px] leading-relaxed">{ai.text}</p>}
                  <button onClick={summarise} disabled={ai.busy || !filtered.length} className="focusable mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-white px-4 text-[13.5px] font-bold text-indigo-deep disabled:opacity-60">{ai.busy ? <><Loader2 size={15} className="animate-spin" />Thinking</> : "Summarise"}</button>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-[1280px] px-4 py-16 md:px-6">
        <h2 className="font-display text-[34px] font-extrabold tracking-[-0.03em] md:text-[44px]">From complaint to change</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-4">
          {[[Megaphone, "Share", "Post a review or report an issue in under a minute, publicly or privately.", "#FF7A2F"], [Users, "Rally", "Neighbours add Me too, so the most urgent problems rise to the top.", "#3B3FD8"], [Activity, "Track", "Every issue moves from Open to Acknowledged, In progress and Resolved.", "#F5B400"], [CheckCircle2, "Change", "Organisations respond, fix and earn trust in public.", "#13A86B"]].map(([I, t, b, c], i) => (
            <div key={t} className="relative rounded-3xl border hair bg-card p-6"><span className="font-display text-[56px] font-extrabold leading-none text-line/10">{i + 1}</span><span className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: c }}><I size={20} /></span><h3 className="mt-2 font-display text-[22px] font-bold">{t}</h3><p className="mt-2 text-[14.5px] leading-relaxed text-mute">{b}</p></div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-gradient-to-br from-saffron/15 to-transparent p-6 ring-1 ring-saffron/20"><Globe2 className="text-saffron" /><h3 className="mt-3 font-display text-[22px] font-bold">Public voices</h3><p className="mt-2 text-[14.5px] leading-relaxed text-mute">Visible to everyone, open to Me too support and tracked in public. Personal phone numbers, emails and ID numbers are removed automatically.</p></div>
          <div className="rounded-3xl bg-gradient-to-br from-indigo/15 to-transparent p-6 ring-1 ring-indigo/20"><Lock className="text-indigo" /><h3 className="mt-3 font-display text-[22px] font-bold">Private feedback</h3><p className="mt-2 text-[14.5px] leading-relaxed text-mute">For sensitive matters. Only you can see it here; in the full platform it is delivered directly to the organisation concerned.</p></div>
        </div>
      </section>

      {/* Official channels */}
      <section id="channels" className="border-t hair">
        <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-6">
          <h2 className="font-display text-[34px] font-extrabold tracking-[-0.03em] md:text-[44px]">Official grievance channels</h2>
          <p className="mt-2 max-w-2xl text-[15px] text-mute">Every issue on One Youth One India links to the right official channel, so your voice also becomes a formal complaint.</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {["e112", "cpgrams", "rti", "consumer", "cyber", "railmadad", "uidai", "rbi", "epfo"].map((k) => { const ch = CHANNELS[k]; return (
              <div key={k} className="flex items-center gap-3 rounded-2xl border hair bg-card p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf/10 text-leaf"><Landmark size={18} /></span>
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold">{ch.name}</span><span className="text-[12.5px] text-mute">{ch.note}</span></span>
                {ch.href ? <a href={ch.href} target="_blank" rel="noopener noreferrer" className="focusable rounded-full p-2 text-indigo" aria-label={`Open ${ch.name}`}><ExternalLink size={16} /></a> : <a href={`tel:${ch.tel}`} className="focusable rounded-full p-2 text-leaf" aria-label={`Call ${ch.name}`}><Phone size={16} /></a>}
              </div>
            ); })}
          </div>
          <p className="mt-4 text-[12.5px] text-faint">Numbers and portals can vary by state. Check your state's official grievance portal too.</p>
        </div>
      </section>

      {/* Guidelines */}
      <section id="guidelines" className="border-t hair bg-raised/40">
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-16 md:px-6 lg:grid-cols-12">
          <div className="lg:col-span-5"><h2 className="font-display text-[34px] font-extrabold tracking-[-0.03em] md:text-[44px]">Community guidelines</h2><p className="mt-3 text-[15.5px] leading-relaxed text-mute">Honest, respectful voices make change happen. Posts that break these rules can be reported and are reviewed by moderators.</p></div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
            {["Share your own genuine experience", "Stick to facts: what, where and when", "No personal attacks, hate or abuse", "Never post other people's private details", "No fake reviews or paid promotion", "Blur bystanders, children and number plates in evidence", "Never put yourself at risk to record evidence", "Report emergencies to 112, not here"].map((g) => <li key={g} className="flex items-start gap-3 rounded-2xl bg-card p-4 text-[14.5px]"><Check size={18} className="mt-0.5 shrink-0 text-leaf" strokeWidth={3} />{g}</li>)}
          </ul>
        </div>
      </section>

      <footer className="border-t hair">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-6 px-4 py-10 md:flex-row md:items-center md:px-6">
          <div><Logo /><p className="mt-3 max-w-sm text-[13.5px] text-mute">Real time public reviews and civic feedback.</p><p className="mt-3 flex flex-col gap-1.5 text-[13.5px]"><a href={`mailto:${CONTACT.email}`} className="focusable inline-flex items-center gap-2 rounded font-semibold text-indigo"><Mail size={15} />{CONTACT.email}</a><span className="inline-flex items-center gap-2 text-mute"><MapPin size={15} />{CONTACT.city}</span><span className="inline-flex items-center gap-2 text-mute"><Globe2 size={15} />{CONTACT.site}</span></p></div>
          <div className="flex flex-wrap gap-5 text-[13.5px] text-mute"><a href="#guidelines" className="hover:text-ink">Guidelines</a><button onClick={() => setLegal("privacy")} className="focusable rounded hover:text-ink">Privacy Policy</button><button onClick={() => setLegal("terms")} className="focusable rounded hover:text-ink">Terms of Use</button><button onClick={() => setLegal("grievance")} className="focusable rounded hover:text-ink">Grievance Officer</button></div>
        </div>
      </footer>

      <AnimatePresence>{legal && <LegalSheet page={legal} setPage={setLegal} onClose={() => setLegal(null)} />}</AnimatePresence>
      <AnimatePresence>{modOpen && store && <ModerationSheet posts={posts} votes={votes} status={status} hidden={hidden} responses={responses} store={store} evStatus={evStatus} onOpenMedia={setLightbox} onClose={() => setModOpen(false)} />}</AnimatePresence>
      <AnimatePresence>{login && store?.auth && <SignInSheet key={authTick} initial={login} auth={store.auth} onClose={() => setLogin(false)} onSignedIn={afterSignIn} />}</AnimatePresence>
      <AnimatePresence>{profileOpen && store && <ProfileSheet store={store} initial={profile} firstTime={!profile?.completed} onClose={() => setProfileOpen(false)} onSaved={(p) => { setProfile(p); setProfileOpen(false); }} onSignOut={signOut} />}</AnimatePresence>
      <AnimatePresence>{lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
      <AnimatePresence>{channel && <ChannelSheet cat={channel} onClose={() => setChannel(null)} />}</AnimatePresence>
      <AnimatePresence>{composer && <Composer sample={store?.sample} canWrite={store?.canWrite !== false} canUpload={!!store?.canUpload} upload={(b, k) => store.uploadEvidence(b, k)} onClose={() => setComposer(false)} onSubmit={(p) => store.addPost(p)} />}</AnimatePresence>

      <AnimatePresence>
        {mine && (
          <motion.div className="fixed inset-0 z-[55] bg-ink/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMine(false)}>
            <motion.aside initial={{ x: 460 }} animate={{ x: 0 }} exit={{ x: 460 }} transition={{ type: "spring", damping: 30, stiffness: 300 }} onClick={(e) => e.stopPropagation()} className="absolute bottom-0 right-0 top-0 w-full max-w-md overflow-y-auto bg-card p-6" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 24px)" }} aria-label="My activity">
              <div className="flex items-center justify-between"><h2 className="font-display text-[24px] font-bold">My activity</h2><button onClick={() => setMine(false)} className="focusable rounded-full p-2 text-mute" aria-label="Close"><X size={20} /></button></div>
              <h3 className="mt-6 flex items-center gap-2 text-[14px] font-bold"><Lock size={15} className="text-indigo" />Private feedback ({priv.length})</h3>
              <ul className="mt-3 space-y-2">{priv.map((p) => <li key={p.id} className="rounded-2xl bg-raised p-4"><p className="text-[14px] font-semibold">{p.title}</p><p className="text-[12.5px] text-mute">{p.entity} · {p.city} · {timeAgo(p.createdAt)}</p></li>)}{!priv.length && <li className="text-[13.5px] text-mute">Nothing private yet.</li>}</ul>
              <h3 className="mt-6 flex items-center gap-2 text-[14px] font-bold"><Globe2 size={15} className="text-saffron" />My public voices ({posts.filter((p) => p.authorId && p.authorId === store?.me).length})</h3>
              <ul className="mt-3 space-y-2">{posts.filter((p) => p.authorId && p.authorId === store?.me).map((p) => <li key={p.id} className="rounded-2xl bg-raised p-4"><p className="text-[14px] font-semibold">{p.title}</p><p className="text-[12.5px] text-mute">{status[p.id] || "Open"} · {votes.metoo[p.id] || 0} Me too · {timeAgo(p.createdAt)}</p></li>)}</ul>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
