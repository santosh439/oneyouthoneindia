import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPrompt, validate } from "../supabase/functions/ask/prompt.ts";
const P = { id: "art-22", ref: "Article 22", title: "Protection against arbitrary arrest", text: "Must be produced within 24 hours.", source: "https://legislative.gov.in/constitution-of-india", jurisdiction: "All of India" };
test("rejects empty, long or unsourced requests", () => {
  assert.equal(typeof validate({ question: "hi", passages: [P] }), "string");
  assert.equal(typeof validate({ question: "x".repeat(301), passages: [P] }), "string");
  assert.equal(typeof validate({ question: "Can police arrest me?", passages: [] }), "string");
  assert.equal(typeof validate({ question: "Can police arrest me?", passages: [{ ...P, source: "https://example.com/x" }] }), "string");
  assert.equal(typeof validate({ question: "Can police arrest me?", passages: [{ ...P, source: "https://evilgov.in.attacker.com/" }] }), "string");
});
test("rejects look-alike domains", () => {
  for (const u of ["https://notgov.in/", "https://gov.in.example.com/", "http://legislative.gov.in/"]) assert.equal(typeof validate({ question: "Can police arrest me?", passages: [{ ...P, source: u }] }), "string", u);
});
test("accepts official passages and caps them at six", () => {
  const v = validate({ question: "Can police arrest me?", passages: Array(9).fill(P) });
  assert.equal(typeof v, "object"); assert.equal(v.passages.length, 6);
});
test("prompt restricts the model to cited passages", () => {
  const { system, user } = buildPrompt("Can police arrest me?", [P]);
  assert.match(system, /ONLY from the numbered passages/); assert.match(system, /not legal advice/); assert.match(system, /same language/);
  assert.match(user, /\[1\] Article 22/); assert.match(user, /Official source: https:\/\/legislative\.gov\.in/);
});
