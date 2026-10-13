import { useEffect, useState } from "react";
import App from "../App.jsx";
import Dashboard from "../portal/Dashboard.jsx";
import Admin from "../portal/Admin.jsx";
import KnowledgePage from "../knowledge/KnowledgePage.jsx";
import SurveyDashboard from "../SurveyDashboard.jsx";
import DirectoryPage from "../DirectoryPage.jsx";
import { PERSONAS, signInAs, resetDemo } from "./mock.js";
import { resetSb } from "../sb.js";
import { loadCms } from "../cms.js";

const read = (k, d) => { try { return localStorage.getItem(k) || d; } catch { return d; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };
const PAGES = [["public", "Public site"], ["survey", "City survey"], ["knowledge", "Know your rights"], ["directory", "Gov websites"], ["dashboard", "My dashboard"], ["admin", "Admin portal"]];

export default function DemoShell() {
  const [page, setPage] = useState(() => read("oyoi-demo-page", "public"));
  const [who, setWho] = useState(() => read("oyoi-demo-who", PERSONAS[0].id));
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => { signInAs(who); resetSb(); write("oyoi-demo-who", who); loadCms().finally(() => setReady(true)); }, [who, tick, page]);
  useEffect(() => { write("oyoi-demo-page", page); window.scrollTo(0, 0); }, [page]);
  // Keep internal links (/, /dashboard, /admin?tab=…) inside the demo instead of leaving the page.
  useEffect(() => {
    const onClick = (e) => {
      const a = e.target.closest?.("a[href^='/']"); if (!a || a.getAttribute("href").startsWith("//")) return;
      const href = new URL(a.getAttribute("href"), "https://x"); e.preventDefault();
      history.replaceState(null, "", `${location.pathname}${href.search}${href.pathname === "/knowledge" ? href.hash : ""}`);
      setPage(href.pathname.startsWith("/dashboard") ? "dashboard" : href.pathname.startsWith("/admin") ? "admin" : href.pathname.startsWith("/knowledge") ? "knowledge" : href.pathname.startsWith("/survey") ? "survey" : href.pathname.startsWith("/directory") ? "directory" : "public"); setTick((t) => t + 1);
      if (href.pathname === "/" && href.hash) setTimeout(() => document.querySelector(href.hash)?.scrollIntoView({ behavior: "smooth" }), 400);
    };
    document.addEventListener("click", onClick, true); return () => document.removeEventListener("click", onClick, true);
  }, []);
  const Page = page === "dashboard" ? Dashboard : page === "admin" ? Admin : page === "knowledge" ? KnowledgePage : page === "survey" ? SurveyDashboard : page === "directory" ? DirectoryPage : App;
  return (
    <>
      {ready && <div style={{ paddingBottom: 76 }}><Page key={`${page}-${who}-${tick}`} /></div>}
      <div className="fixed inset-x-0 bottom-0 z-[45] border-t border-white/10 bg-[#16152B] text-white shadow-2xl" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-3 py-2.5 text-[13px]">
          <span className="rounded-full bg-gradient-to-r from-saffron via-indigo to-leaf px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide">Demo preview</span>
          <div className="flex gap-1 rounded-full bg-white/10 p-1">
            {PAGES.map(([k, l]) => <button key={k} onClick={() => { history.replaceState(null, "", location.pathname); setPage(k); }} className={`rounded-full px-3 py-1.5 font-semibold ${page === k ? "bg-white text-[#16152B]" : "text-white/80 hover:text-white"}`}>{l}</button>)}
          </div>
          <label className="flex items-center gap-2 text-white/70">Viewing as
            <select value={who} onChange={(e) => setWho(e.target.value)} className="rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white outline-none">
              {PERSONAS.map((p) => <option key={p.id} value={p.id} className="text-black">{p.name}</option>)}
            </select>
          </label>
          <span className="hidden text-white/50 lg:inline">Sample data stays in this browser only.</span>
          <button onClick={() => { if (confirm("Reset all demo data?")) { resetDemo(); setTick((t) => t + 1); } }} className="ml-auto rounded-full px-3 py-1.5 font-semibold text-white/70 hover:bg-white/10 hover:text-white">Reset demo</button>
        </div>
      </div>
    </>
  );
}
