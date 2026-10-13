// Supabase Edge Function: "Ask Your Constitution" answer writer (optional).
// The website retrieves verified passages first; this function only rephrases them into a
// helpful answer and must cite them. It never adds facts that are not in the passages.
//
// Deploy:  supabase functions deploy ask
// Secrets: supabase secrets set ANTHROPIC_API_KEY=...   (optional: ASK_MODEL)
// Enable on the site by adding the GitHub secret VITE_ASK_AI=1 and rebuilding.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

import { buildPrompt, validate } from "./prompt.ts";

if (import.meta.main) Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) return json({ error: "AI answers are not configured" }, 503);

  // Signed in users only, to limit abuse and cost.
  const auth = req.headers.get("Authorization") ?? "";
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return json({ error: "Please sign in to use AI answers" }, 401);

  const v = validate(await req.json().catch(() => ({})));
  if (typeof v === "string") return json({ error: v }, 400);
  const { system, user: prompt } = buildPrompt(v.question, v.passages);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: Deno.env.get("ASK_MODEL") ?? "claude-sonnet-4-6", max_tokens: 600, system, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) return json({ error: "The AI service is unavailable right now" }, 502);
  const data = await r.json();
  const answer = (data.content ?? []).filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n").trim();
  return json({ answer, cited: v.passages.map((p) => ({ id: p.id, ref: p.ref, source: p.source })) });
});
