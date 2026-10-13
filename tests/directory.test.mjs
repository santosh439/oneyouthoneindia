import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { allLinks, STATE_PORTALS, MINISTRIES, SECTORS } from "../src/directory.js";

const OFFICIAL = /^https:\/\/([a-z0-9-]+\.)*((gov|nic)\.in|mygov\.in|sansad\.in|rbi\.org\.in)(\/|$)/i;
test("every link is https on an official government domain", () => {
  for (const l of allLinks()) assert.match(l.url, OFFICIAL, l.name);
});
test("no duplicate links", () => {
  const urls = allLinks().map((l) => l.url.replace(/\/$/, "").replace("://www.", "://"));
  assert.equal(new Set(urls).size, urls.length, urls.filter((u, i) => urls.indexOf(u) !== i).join(", "));
});
test("all 28 States and 8 UTs are present", () => {
  assert.equal(STATE_PORTALS.filter((s) => s.type === "state").length, 28);
  assert.equal(STATE_PORTALS.filter((s) => s.type === "ut").length, 8);
  const geo = JSON.parse(readFileSync(new URL("../src/geo.json", import.meta.url))).map((g) => g.name.toLowerCase().replace(/^the /, ""));
  for (const s of STATE_PORTALS) assert.ok(geo.includes(s.name.toLowerCase()), s.name);
});
test("every ministry has a known sector", () => {
  for (const m of MINISTRIES) assert.ok(SECTORS.includes(m.sector), m.name);
  assert.ok(MINISTRIES.length >= 50);
});
