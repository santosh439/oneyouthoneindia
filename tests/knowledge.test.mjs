import { test } from "node:test";
import assert from "node:assert/strict";
import { makeIndex, answer, buildDocs } from "../src/knowledge/index.js";
import { rtiDeadlines, draftRti } from "../src/knowledge/rti.js";
import { LEVELS } from "../src/knowledge/government.js";

const search = makeIndex();
const top = (q) => search(q, 3)[0]?.doc.id;

test("every entry carries an official source and jurisdiction", () => {
  for (const d of buildDocs()) { assert.match(d.source.url, /^https:\/\/([a-z0-9-]+\.)*(gov|nic)\.in(\/|$)/i, d.id); assert.ok(d.jurisdiction, d.id); }
});
test("retrieval finds the right entry", () => {
  const cases = [
    ["Can police arrest me without telling the reason?", "art-22"], ["right to free education for children", "art-21a"],
    ["Article 21", "art-21"], ["article 14 equality", "art-14"], ["what is the 73rd amendment", "amd-73rd"],
    ["RTI application fee", "rti-fee-0"], ["is untouchability allowed", "art-17"], ["who heads the district administration collector", "gov-dm"],
    ["patwari land records", "gov-vro"], 
    ["मौलिक अधिकार शिक्षा", "art-21a"], ["giraftari", "art-22"], 
  ];
  for (const [q, want] of cases) assert.equal(top(q), want, `query: ${q} -> got ${top(q)}`);
});
test("questions with two correct entries still return one that states the fact", () => {
  const v = search("voting age 18", 1)[0].doc; assert.ok(["art-326", "amd-61st"].includes(v.id)); assert.match(v.text, /18/);
});
test("appeal questions land on an entry stating the 90 day limit", () => {
  const d = search("second appeal information commission 90 days", 1)[0].doc;
  assert.ok(["rti-time-6", "rti-section19"].includes(d.id)); assert.match(d.text + d.title, /90 days/);
});
test("unrelated questions return nothing rather than guessing", () => {
  assert.equal(answer("best pizza recipe with cheese", search).found, false);
});
test("RTI deadlines follow the Act", () => {
  const t = "2026-01-10";
  assert.equal(rtiDeadlines({ filed_on: "2026-01-01" }, t).replyDue, "2026-01-31");
  assert.equal(rtiDeadlines({ filed_on: "2026-01-01", via_apio: true }, t).replyDue, "2026-02-05");
  assert.equal(rtiDeadlines({ filed_on: "2026-01-01", life_liberty: true }, t).replyDue, "2026-01-03");
  assert.equal(rtiDeadlines({ filed_on: "2026-01-01", third_party: true }, t).replyDue, "2026-02-10");
  const over = rtiDeadlines({ filed_on: "2026-01-01" }, "2026-02-05");
  assert.equal(over.next.stage, "overdue"); assert.equal(over.firstAppealBy, "2026-03-02");
  const fa = rtiDeadlines({ filed_on: "2026-01-01", reply_on: "2026-01-20", fa_filed_on: "2026-02-01" }, "2026-02-10");
  assert.equal(fa.next.stage, "first_appeal"); assert.equal(fa.faDecisionDue, "2026-03-03");
  const sa = rtiDeadlines({ filed_on: "2026-01-01", fa_filed_on: "2026-02-01", fa_order_on: "2026-02-20" }, "2026-03-01");
  assert.equal(sa.next.stage, "second_appeal_window"); assert.equal(sa.secondAppealBy, "2026-05-21");
});
test("drafting assistant produces a complete application", () => {
  const t = draftRti({ authority: "Bruhat Bengaluru Mahanagara Palike", questions: ["Copy of work order for road X", "", "Amount paid to contractor"], name: "Aarav", bpl: true, level: "state", state: "Karnataka" });
  assert.match(t, /Section 6\(1\)/); assert.match(t, /1\. Copy of work order/); assert.match(t, /2\. Amount paid/); assert.match(t, /Below Poverty Line/); assert.doesNotMatch(t, /\n\n\n/);
});
test("government explorer labels every role clearly", () => {
  for (const lv of LEVELS) for (const r of lv.roles) { assert.ok(["elected", "constitutional", "statutory", "judicial", "civil", "support", "community", "body"].includes(r.kind), r.id); assert.ok(r.role.length > 20, r.id); }
});
test("all 8 Union Territories are recognised whatever the spelling", async () => {
  const { utInfo } = await import("../src/knowledge/government.js");
  for (const n of ["Jammu And Kashmir", "The Dadra And Nagar Haveli And Daman And Diu", "Andaman And Nicobar Islands", "Ladakh", "Delhi", "Chandigarh", "Lakshadweep", "Puducherry"]) assert.ok(utInfo(n), n);
  for (const n of ["Karnataka", "Kerala", "Uttar Pradesh"]) assert.equal(utInfo(n), null, n);
});
test("library links go straight to official PDF files", async () => {
  const { LIBRARY } = await import("../src/knowledge/constitution.js");
  assert.ok(LIBRARY.length >= 8);
  for (const [t, , ed, u] of LIBRARY) { assert.match(u, /^https:\/\/([a-z0-9-]+\.)*(gov|nic)\.in\/.+\.pdf$/i, t); assert.ok(ed, t); }
});
