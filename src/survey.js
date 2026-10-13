/* All India City Survey: what citizens rate, how scores are banded, and data access.
 * Scores are 1 to 5 per service; the meter shows 0 to 100 ((average - 1) / 4 x 100). */
import { sb, hasSupabase } from "./sb.js";

export const DIMS = [
  ["roads", "Roads and footpaths"], ["water", "Water supply"], ["power", "Electricity"], ["cleanliness", "Cleanliness and garbage"],
  ["safety", "Safety and policing"], ["transport", "Public transport"], ["health", "Healthcare"], ["education", "Schools and education"],
];
export const SCALE = [[1, "Very poor"], [2, "Poor"], [3, "Average"], [4, "Good"], [5, "Excellent"]];
export const MIN_RESPONSES = 3;
export const BANDS = [[75, "Excellent", "#13A86B"], [60, "Good", "#3B3FD8"], [40, "Needs improvement", "#F5B400"], [0, "Needs urgent attention", "#E5484D"]];
export const band = (s) => (s == null ? ["No data yet", "#9CA3AF"] : (BANDS.find(([m]) => Math.round(s) >= m) || BANDS[3]).slice(1));

const must = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
export async function fetchMeter() {
  if (!hasSupabase()) return { cities: [], india: null };
  const [cities, india] = await Promise.all([sb().rpc("city_meter", { p_min: MIN_RESPONSES }), sb().rpc("india_meter")]);
  return { cities: must(cities) || [], india: (must(india) || [])[0] || null };
}
export const myResponses = async (uid) => (uid && hasSupabase() ? must(await sb().from("city_survey").select("*").eq("user_id", uid)) : []);
export async function saveResponse(uid, existing, r) {
  const row = { state: r.state, district: r.district || null, city: r.city.trim(), scores: r.scores };
  if (existing) return must(await sb().from("city_survey").update(row).eq("id", existing.id).select().single());
  return must(await sb().from("city_survey").insert({ ...row, user_id: uid }).select().single());
}
export const cityKey = (state, city) => `${String(state).trim().toLowerCase()}|${String(city).trim().toLowerCase()}`;

// Full dashboard data: cities, States, national totals and weekly trend (all aggregates).
export async function fetchDashboard() {
  if (!hasSupabase()) return { cities: [], states: [], india: null, trend: [] };
  const [c, st, i, t] = await Promise.all([sb().rpc("city_meter", { p_min: MIN_RESPONSES }), sb().rpc("state_meter", { p_min: MIN_RESPONSES }), sb().rpc("india_meter"), sb().rpc("survey_trend", { p_weeks: 12 })]);
  return { cities: must(c) || [], states: must(st) || [], india: (must(i) || [])[0] || null, trend: must(t) || [] };
}

/* Tile map of India: one tile per State and UT, arranged roughly by geography. Not to scale and
 * not a boundary map. [code, name, column, row] */
export const TILES = [
  ["LA", "Ladakh", 5, 0], ["JK", "Jammu and Kashmir", 4, 0], ["HP", "Himachal Pradesh", 5, 1], ["PB", "Punjab", 4, 1], ["CH", "Chandigarh", 3, 1],
  ["UK", "Uttarakhand", 6, 2], ["HR", "Haryana", 4, 2], ["DL", "Delhi", 5, 2], ["RJ", "Rajasthan", 3, 3], ["UP", "Uttar Pradesh", 5, 3],
  ["BR", "Bihar", 6, 3], ["SK", "Sikkim", 7, 2], ["AR", "Arunachal Pradesh", 9, 2], ["AS", "Assam", 8, 3], ["NL", "Nagaland", 9, 3],
  ["GJ", "Gujarat", 2, 4], ["MP", "Madhya Pradesh", 4, 4], ["JH", "Jharkhand", 6, 4], ["WB", "West Bengal", 7, 4], ["ML", "Meghalaya", 8, 4], ["MN", "Manipur", 9, 4],
  ["DH", "Dadra and Nagar Haveli and Daman and Diu", 2, 5], ["MH", "Maharashtra", 3, 5], ["CG", "Chhattisgarh", 5, 5], ["OD", "Odisha", 6, 5], ["TR", "Tripura", 8, 5], ["MZ", "Mizoram", 9, 5],
  ["GA", "Goa", 3, 6], ["TS", "Telangana", 4, 6], ["AP", "Andhra Pradesh", 5, 6],
  ["KA", "Karnataka", 4, 7], ["LD", "Lakshadweep", 2, 8], ["KL", "Kerala", 4, 8], ["TN", "Tamil Nadu", 5, 8], ["PY", "Puducherry", 6, 8], ["AN", "Andaman and Nicobar Islands", 8, 8],
];
export const tileKey = (n) => String(n || "").toLowerCase().replace(/^the\s+/, "").replace(/\s+/g, " ").trim();
