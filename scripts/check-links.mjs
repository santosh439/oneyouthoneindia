// Checks every government link the site shows. Run by GitHub Actions weekly ("Link check")
// or locally with:  node scripts/check-links.mjs
// A link passes when it answers with HTTP 2xx or 3xx within 25 seconds.
import { allLinks } from "../src/directory.js";
import { LIBRARY } from "../src/knowledge/constitution.js";
import { RTI_SOURCES } from "../src/knowledge/rti.js";
import { GOV_SOURCES } from "../src/knowledge/government.js";

const urls = [...new Map([
  ...allLinks().map((l) => [l.url, l.name]),
  ...LIBRARY.map(([t, , , url]) => [url, `Constitution PDF: ${t}`]),
  ...Object.values(RTI_SOURCES).map((s) => [s.url, s.label]),
  ...Object.values(GOV_SOURCES).map((s) => [s.url, s.label]),
]).entries()];

async function check(url) {
  for (const method of ["HEAD", "GET"]) {
    try {
      const r = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(25000), headers: { "User-Agent": "Mozilla/5.0 (OneYouthOneIndia link checker)" } });
      if (r.status < 400) return { ok: true, status: r.status, final: r.url };
      if (method === "GET") return { ok: false, status: r.status };
    } catch (e) { if (method === "GET") return { ok: false, status: e.name === "TimeoutError" ? "timeout" : e.cause?.code || e.message }; }
  }
}
const results = [];
for (let i = 0; i < urls.length; i += 8) results.push(...(await Promise.all(urls.slice(i, i + 8).map(async ([url, name]) => ({ url, name, ...(await check(url)) })))));
const bad = results.filter((r) => !r.ok);
const lines = [`# Government link check`, ``, `${results.length - bad.length} of ${results.length} links working.`, ``];
if (bad.length) lines.push(`| Name | Link | Problem |`, `|---|---|---|`, ...bad.map((b) => `| ${b.name} | ${b.url} | ${b.status} |`));
console.log(lines.join("\n"));
if (process.env.GITHUB_STEP_SUMMARY) (await import("node:fs")).appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n");
process.exit(bad.length ? 1 : 0);
