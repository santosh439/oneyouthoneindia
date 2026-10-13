import { useEffect, useState } from "react";
import { ArrowLeft, Moon, Sun, X, Loader2, Inbox } from "lucide-react";
import { STATUS_COLOR, STATUS_LABEL, PUB_LABEL, fmt } from "./api.js";

export function useTheme() {
  const [theme, setTheme] = useState(() => { try { return localStorage.getItem("oyoi-theme") || ""; } catch { return ""; } });
  const isDark = theme ? theme === "dark" : typeof matchMedia !== "undefined" && matchMedia("(prefers-color-scheme: dark)").matches;
  useEffect(() => { if (theme) document.documentElement.dataset.theme = theme; try { theme && localStorage.setItem("oyoi-theme", theme); } catch { /* ignore */ } }, [theme]);
  return [isDark, () => setTheme(isDark ? "light" : "dark")];
}

export function Mark() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="pm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FF7A2F" /><stop offset=".55" stopColor="#3B3FD8" /><stop offset="1" stopColor="#13A86B" /></linearGradient></defs><path d="M20 3c9.4 0 17 7.2 17 16.1 0 8.2-6.6 13-13.5 17.4L20 39l-3.5-2.5C9.6 32.1 3 27.3 3 19.1 3 10.2 10.6 3 20 3z" fill="url(#pm)" /><circle cx="13.5" cy="19" r="2.2" fill="#fff" /><circle cx="20" cy="19" r="2.2" fill="#fff" /><circle cx="26.5" cy="19" r="2.2" fill="#fff" /></svg>
      <span className="font-display text-[17px] font-extrabold tracking-tight">OneYouth<span className="text-saffron">One</span><span className="text-indigo">India</span></span>
    </span>
  );
}

export function Shell({ title, subtitle, right, children, nav }) {
  const [isDark, toggle] = useTheme();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b hair bg-bg/85 backdrop-blur-xl" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-6">
          <a href="/" className="focusable rounded-lg" aria-label="Back to the public site"><Mark /></a>
          <span className="hidden rounded-full bg-raised px-3 py-1 text-[12.5px] font-semibold text-mute sm:inline">{title}</span>
          <div className="ml-auto flex items-center gap-1.5">
            {right}
            <a href="/" className="focusable hidden h-10 items-center gap-1.5 rounded-full px-3 text-[13.5px] font-semibold text-mute hover:bg-raised md:inline-flex"><ArrowLeft size={16} />Public site</a>
            <button onClick={toggle} className="focusable rounded-full p-2.5 text-mute hover:bg-raised" aria-label="Toggle light and dark mode">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 md:px-6">
        {nav}
        <main className="min-w-0 flex-1">
          {subtitle !== undefined && <div className="mb-6"><h1 className="font-display text-[28px] font-extrabold leading-tight md:text-[34px]">{subtitle}</h1></div>}
          {children}
        </main>
      </div>
    </div>
  );
}

export const Kpi = ({ label, value, color = "#3B3FD8", icon: I, hint, onClick, active }) => (
  <button type="button" onClick={onClick} disabled={!onClick} aria-pressed={active} className={`focusable rounded-2xl border p-4 text-left transition ${active ? "border-transparent bg-ink text-bg" : "hair2 bg-card"} ${onClick ? "hover:-translate-y-0.5" : "cursor-default"}`}>
    <div className="flex items-center justify-between">{I && <I size={18} style={{ color: active ? undefined : color }} />}{hint && <span className={`text-[11px] ${active ? "text-bg/70" : "text-faint"}`}>{hint}</span>}</div>
    <p className="tab mt-2 font-display text-[30px] font-extrabold leading-none">{value}</p>
    <p className={`mt-1.5 text-[12.5px] ${active ? "text-bg/80" : "text-mute"}`}>{label}</p>
  </button>
);

export const StatusBadge = ({ s }) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-bold" style={{ background: `${STATUS_COLOR[s] || "#888"}1A`, color: STATUS_COLOR[s] || "#888" }}>
    <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_COLOR[s] || "#888" }} />{STATUS_LABEL[s] || s}
  </span>
);
export const PubBadge = ({ p, withdrawn }) => {
  if (withdrawn) return <span className="whitespace-nowrap rounded-full bg-raised px-2.5 py-1 text-[11.5px] font-semibold text-mute">Withdrawn</span>;
  const c = { pending: "#B45309", approved: "#13A86B", rejected: "#E5484D", private: "#6B7280" }[p] || "#888";
  return <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-semibold" style={{ background: `${c}14`, color: c }}>{PUB_LABEL[p] || p}</span>;
};

const EV_TEXT = {
  created: () => "Feedback submitted",
  status: (e) => `Status changed: ${STATUS_LABEL[e.from_value] || e.from_value} → ${STATUS_LABEL[e.to_value] || e.to_value}`,
  publication: (e) => `Publication: ${PUB_LABEL[e.to_value] || e.to_value}`,
  assignment: (e) => (e.to_value ? "Assigned to a team member" : "Unassigned"),
  response: () => "Official response added",
  note: () => "Internal note",
  withdrawn: () => "Withdrawn by the submitter",
  hidden: (e) => (e.to_value === "true" ? "Hidden from public view" : "Restored to public view"),
};
export function Timeline({ events, names = {} }) {
  if (!events) return <p className="flex items-center gap-2 text-[13px] text-mute"><Loader2 size={15} className="animate-spin" />Loading history</p>;
  if (!events.length) return <p className="text-[13px] text-mute">No activity yet.</p>;
  return (
    <ol className="relative ml-2 border-l-2 hair2 pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative mb-4 last:mb-0">
          <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-bg" style={{ background: e.kind === "note" ? "#7C3AED" : e.kind === "status" ? STATUS_COLOR[e.to_value] || "#3B3FD8" : "#3B3FD8" }} />
          <p className="text-[13.5px] font-semibold">{(EV_TEXT[e.kind] || (() => e.kind))(e)}{e.kind === "note" && <span className="ml-2 rounded bg-indigo/10 px-1.5 py-0.5 text-[10.5px] font-bold uppercase text-indigo">Staff only</span>}</p>
          {e.kind === "response" && e.to_value && <p className="mt-1 rounded-xl bg-raised p-2.5 text-[13px]">{e.to_value}</p>}
          {e.reason && <p className="mt-1 text-[13px] text-ink/80">{e.reason}</p>}
          <p className="mt-0.5 text-[11.5px] text-faint">{fmt(e.created_at)}{names[e.actor] ? ` · ${names[e.actor]}` : ""}</p>
        </li>
      ))}
    </ol>
  );
}

export function Drawer({ title, onClose, children, footer }) {
  useEffect(() => { const k = (e) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex h-full w-full max-w-[640px] flex-col bg-bg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b hair px-5 py-4"><h2 className="min-w-0 flex-1 truncate font-display text-[19px] font-bold">{title}</h2><button onClick={onClose} className="focusable rounded-full p-2 hover:bg-raised" aria-label="Close"><X size={18} /></button></div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="border-t hair px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export const Empty = ({ text, icon: I = Inbox }) => (
  <div className="rounded-2xl border border-dashed hair2 bg-card p-10 text-center"><I size={26} className="mx-auto text-faint" /><p className="mt-3 text-[14px] text-mute">{text}</p></div>
);
export const Card = ({ title, action, children, className = "" }) => (
  <section className={`rounded-2xl border hair2 bg-card p-5 ${className}`}>
    {(title || action) && <div className="mb-4 flex items-center gap-3"><h3 className="flex-1 font-display text-[16px] font-bold">{title}</h3>{action}</div>}
    {children}
  </section>
);

// Horizontal bars, no chart library needed.
export function Bars({ rows, color = "#3B3FD8", empty = "No data yet" }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  if (!rows.length) return <p className="text-[13px] text-mute">{empty}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map(([label, n, c]) => (
        <li key={label}><div className="flex justify-between text-[12.5px]"><span className="truncate pr-2">{label}</span><span className="tab font-bold">{n}</span></div>
          <div className="mt-1 h-2 rounded-full bg-raised"><div className="h-2 rounded-full" style={{ width: `${(n / max) * 100}%`, background: c || color }} /></div></li>
      ))}
    </ul>
  );
}
// Daily columns for the last N days.
export function Trend({ items, days = 30, color = "#3B3FD8" }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const buckets = Array.from({ length: days }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - (days - 1 - i)); return { d, n: 0 }; });
  items.forEach((iso) => { const d = new Date(iso); d.setHours(0, 0, 0, 0); const i = Math.round((d - buckets[0].d) / 864e5); if (i >= 0 && i < days) buckets[i].n++; });
  const max = Math.max(1, ...buckets.map((b) => b.n));
  return (
    <div>
      <div className="flex h-36 items-end gap-[3px]" role="img" aria-label={`Submissions per day for the last ${days} days`}>
        {buckets.map((b) => <div key={+b.d} className="flex-1 rounded-t" title={`${b.d.toLocaleDateString("en-IN")}: ${b.n}`} style={{ height: `${Math.max(3, (b.n / max) * 100)}%`, background: b.n ? color : "rgb(var(--line) / 0.08)" }} />)}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] text-faint"><span>{buckets[0].d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span><span>Today</span></div>
    </div>
  );
}

export const Input = (p) => <input {...p} className={`focusable h-10 rounded-full border hair2 bg-card px-4 text-[13.5px] outline-none ${p.className || ""}`} />;
export const Select = ({ children, ...p }) => <select {...p} className={`focusable h-10 rounded-full border hair2 bg-card px-3 text-[13.5px] ${p.className || ""}`}>{children}</select>;
export const Btn = ({ tone = "ink", children, ...p }) => {
  const t = { ink: "bg-ink text-bg", leaf: "bg-leaf text-white", ruby: "bg-ruby text-white", soft: "bg-raised text-ink", indigo: "bg-indigo text-white" }[tone];
  return <button {...p} className={`focusable inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[13.5px] font-bold disabled:opacity-50 ${t} ${p.className || ""}`}>{children}</button>;
};
