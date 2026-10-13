import React, { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { loadCms } from "./cms.js";
import "./index.css";
const Dashboard = lazy(() => import("./portal/Dashboard.jsx"));
const Admin = lazy(() => import("./portal/Admin.jsx"));
const Knowledge = lazy(() => import("./knowledge/KnowledgePage.jsx"));
const Survey = lazy(() => import("./SurveyDashboard.jsx"));
const Directory = lazy(() => import("./DirectoryPage.jsx"));
const root = createRoot(document.getElementById("root"));
if (import.meta.env.VITE_DEMO) {
  // Demo preview build only: in-browser sample database and persona switcher.
  Promise.all([import("./demo/mock.js"), import("./demo/DemoShell.jsx")]).then(([m, s]) => { m.installMock(); const Shell = s.default; root.render(<Shell />); });
} else if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // A live build must always use the real database. Never fall back to a browser-only store.
  root.render(
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 560, margin: "15vh auto", padding: 24, textAlign: "center", lineHeight: 1.5 }}>
      <h1 style={{ fontSize: 28 }}>One Youth One India</h1>
      <p>The service is temporarily unavailable while we complete maintenance. Please try again shortly.</p>
      <p style={{ color: "#666", fontSize: 14 }}>Contact: help@oneyouthoneindia.com</p>
    </main>);
  console.error("Build is missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them as GitHub secrets and redeploy.");
} else {
  const path = location.pathname.replace(/\/+$/, "");
  const Page = path === "/dashboard" ? Dashboard : path === "/admin" ? Admin : path === "/knowledge" ? Knowledge : path === "/survey" ? Survey : path === "/directory" ? Directory : App;
  const render = () => root.render(<Suspense fallback={null}><Page /></Suspense>);
  if (Page === App) loadCms().finally(render); else render();
}
