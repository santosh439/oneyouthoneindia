/* Official grievance channels. Numbers and portals can vary by state; confirm before relying on them. */
export const CHANNELS = {
  cpgrams: { name: "CPGRAMS public grievance portal", note: "Central government departments", href: "https://pgportal.gov.in" },
  rti: { name: "RTI Online", note: "Right to Information request to central authorities", href: "https://rtionline.gov.in" },
  state: { name: "Your state grievance portal or CM helpline", note: "Search your state's official portal" },
  municipal: { name: "Your municipal corporation helpline or app", note: "Ward office or civic app in your city" },
  e112: { name: "Emergency 112", note: "Police, fire and medical emergencies", tel: "112" },
  amb108: { name: "Ambulance 108", note: "Available in most states", tel: "108" },
  health104: { name: "Health helpline 104", note: "Available in many states", tel: "104" },
  women181: { name: "Women helpline 181", note: "Available in many states", tel: "181" },
  child1098: { name: "Child helpline 1098", note: "Children in need of care and protection", tel: "1098" },
  cyber: { name: "Cyber crime 1930 and cybercrime.gov.in", note: "Online fraud and cyber crime", href: "https://cybercrime.gov.in", tel: "1930" },
  nalsa: { name: "Free legal aid 15100", note: "Legal services authorities", tel: "15100" },
  consumer: { name: "National Consumer Helpline 1915", note: "Complaints about products and services", href: "https://consumerhelpline.gov.in", tel: "1915" },
  edaakhil: { name: "e-Daakhil consumer commission filing", note: "File a consumer case online", href: "https://edaakhil.nic.in" },
  nhai: { name: "National highways helpline 1033", note: "Highway emergencies and complaints", tel: "1033" },
  railmadad: { name: "Rail Madad 139", note: "Indian Railways complaints", href: "https://railmadad.indianrailways.gov.in", tel: "139" },
  parivahan: { name: "Parivahan Sewa", note: "Licence and vehicle services", href: "https://parivahan.gov.in" },
  power1912: { name: "Electricity complaints 1912", note: "Available in many states", tel: "1912" },
  lpg1906: { name: "LPG emergency 1906", note: "Gas leaks and LPG emergencies", tel: "1906" },
  rbi: { name: "RBI complaint management system", note: "Banking ombudsman complaints", href: "https://cms.rbi.org.in" },
  epfo: { name: "EPFO grievance portal", note: "Provident fund and pension", href: "https://epfigms.gov.in" },
  uidai: { name: "Aadhaar helpline 1947", note: "UIDAI", href: "https://uidai.gov.in", tel: "1947" },
  passport: { name: "Passport Seva", note: "Ministry of External Affairs", href: "https://www.passportindia.gov.in" },
  kisan: { name: "Kisan Call Centre 1800 180 1551", note: "Farmers' queries", tel: "18001801551" },
  cvc: { name: "Central Vigilance Commission complaint portal", note: "Corruption by central government employees", href: "https://portal.cvc.gov.in" },
  acb: { name: "Your state Anti Corruption Bureau or Lokayukta", note: "Corruption by state and local officials; search your state's official site" },
};

const PALETTE = ["#3B3FD8", "#E5484D", "#D9467F", "#A16207", "#0E7490", "#7C3AED", "#4F46E5", "#0F766E", "#EA580C", "#2563EB", "#475569", "#0891B2", "#B45309", "#DC2626", "#1D4ED8", "#9333EA", "#047857", "#C2410C", "#166534", "#7E22CE", "#BE185D", "#15803D", "#334155", "#4D7C0F", "#DB2777", "#0369A1", "#C026D3"];
const C = (id, name, icon, hint, subs, channels) => ({ id, name, icon, hint, subs, channels });
const LIST = [
  C("education", "Education", "GraduationCap", "Schools, colleges, boards", ["Government school", "Kendriya Vidyalaya", "Jawahar Navodaya Vidyalaya", "State or central university", "IIT, NIT or IIM", "ITI", "CBSE or state board"], ["state", "cpgrams", "rti"]),
  C("health", "Healthcare", "HeartPulse", "Hospitals, PHCs, medicines", ["AIIMS or central hospital", "District hospital", "Community health centre (CHC)", "Primary health centre (PHC)", "ESIC hospital", "CGHS dispensary", "Jan Aushadhi Kendra", "Ayushman Bharat"], ["amb108", "health104", "state", "cpgrams"]),
  C("women", "Women and Child", "Baby", "Anganwadi, safety support", ["Anganwadi centre", "One Stop Centre", "Child welfare committee", "Maternity benefit"], ["women181", "child1098", "e112", "state"]),
  C("food", "Food and Ration", "Wheat", "Ration shops, PDS", ["Fair price (ration) shop", "Ration card", "Food Corporation of India"], ["state", "cpgrams"]),
  C("identity", "Identity and Documents", "IdCard", "Aadhaar, passport, voter ID", ["Aadhaar (UIDAI)", "Passport Seva", "Voter ID", "PAN", "Birth or death certificate"], ["uidai", "passport", "cpgrams"]),
  C("revenue", "Revenue and Land", "FileText", "Land records, certificates", ["Tahsildar or revenue office", "Sub registrar office", "District collectorate", "Caste, income or residence certificate"], ["state", "rti"]),
  C("police", "Police and Safety", "Siren", "Police, traffic, fire", ["Police station", "Traffic police", "Cyber crime cell", "Fire services", "Disaster management"], ["e112", "cyber", "state"]),
  C("courts", "Courts and Justice", "Scale", "Courts, legal aid, consumer forums", ["District court", "High Court", "Legal services authority", "Consumer commission"], ["nalsa", "edaakhil"]),
  C("roads", "Roads and Highways", "Construction", "Potholes, repairs, tolls", ["National highway (NHAI)", "State highway (PWD)", "City road", "Toll plaza", "Flyover or bridge"], ["nhai", "municipal", "state"]),
  C("transport", "Public Transport", "TrainFront", "Rail, metro, buses, airports", ["Indian Railways", "Metro rail", "State transport bus", "City bus", "Airport"], ["railmadad", "state", "cpgrams"]),
  C("vehicles", "Vehicles and Licences", "Car", "RTO services", ["Driving licence", "Vehicle registration", "Permit", "RTO office"], ["parivahan", "state"]),
  C("water", "Water and Sanitation", "Droplets", "Supply, drainage, garbage", ["Water supply", "Drainage or sewage", "Public toilet", "Garbage collection"], ["municipal", "state"]),
  C("power", "Electricity", "Zap", "Outages, billing, streetlights", ["Power outage", "New connection", "Billing or meter", "Streetlight"], ["power1912", "state"]),
  C("gas", "Gas and Fuel", "Flame", "LPG, fuel stations", ["LPG cylinder", "Ujjwala connection", "Fuel station"], ["lpg1906", "consumer"]),
  C("banking", "Banking and Insurance", "Banknote", "Banks, LIC, insurers", ["Public sector bank", "Jan Dhan account", "LIC", "Public sector insurer", "Loan or ATM"], ["rbi", "consumer", "cpgrams"]),
  C("post", "Post and Telecom", "Mail", "India Post, BSNL", ["Post office", "Speed post or parcel", "Post office savings", "BSNL mobile or broadband"], ["cpgrams", "consumer"]),
  C("pensions", "Pensions and Social Security", "PiggyBank", "EPFO, ESIC, pensions", ["Provident fund (EPFO)", "ESIC", "Old age pension", "Widow or disability pension"], ["epfo", "cpgrams", "state"]),
  C("employment", "Employment and Skills", "Briefcase", "Jobs, training, MGNREGA", ["Employment exchange", "Skill India centre", "MGNREGA work or wages"], ["state", "cpgrams"]),
  C("agriculture", "Agriculture", "Sprout", "Farm support, mandis", ["Agriculture department", "Krishi Vigyan Kendra", "APMC mandi", "PM KISAN", "Crop insurance", "Fertiliser or seeds"], ["kisan", "state", "cpgrams"]),
  C("taxes", "Taxes", "Receipt", "Income tax, GST, property tax", ["Income tax", "GST", "Property tax"], ["cpgrams", "municipal"]),
  C("housing", "Housing and Urban", "House", "Housing, approvals", ["Development authority", "Housing board", "PM Awas Yojana", "Building approval"], ["state", "municipal", "cpgrams"]),
  C("environment", "Environment", "Trees", "Pollution, parks, lakes", ["Air pollution", "Noise pollution", "Lake or river", "Park", "Tree cutting", "Forest department"], ["state", "municipal"]),
  C("municipal", "Municipal Services", "Building2", "Ward offices, civic issues", ["Ward office", "Trade licence", "Stray animals", "Encroachment", "Birth or death registration"], ["municipal", "state"]),
  C("rural", "Rural Services", "Tractor", "Gram panchayat, block office", ["Gram panchayat", "Block development office", "Village road", "Drinking water"], ["state", "cpgrams"]),
  C("welfare", "Welfare of Communities", "HeartHandshake", "Scholarships, hostels, schemes", ["Scholarship", "Hostel", "Reservation certificate", "Tribal welfare", "Minority welfare"], ["state", "cpgrams"]),
  C("digital", "Digital Services", "Smartphone", "CSC, DigiLocker, UMANG", ["Common Service Centre", "DigiLocker", "UMANG", "State e-district portal"], ["cpgrams", "state"]),
  C("corruption", "Corruption and Bribery", "HandCoins", "Bribes, extortion, scheme fraud", ["Bribe demanded", "Bribe paid under pressure", "Extortion by an official", "Fraud in a government scheme", "Fake fees or receipts"], ["acb", "cvc", "cpgrams"]),
  C("products", "Products and Shopping", "ShoppingBag", "Brands, delivery, stores", ["Online shopping", "Food delivery", "Retail store", "Electronics", "Other product"], ["consumer", "edaakhil"]),
];
export const CATEGORIES = LIST.map((c, i) => ({ ...c, color: PALETTE[i % PALETTE.length], govt: c.id !== "products" }));
const ALIAS = { safety: "police", govt: "identity", finance: "banking" };
export const catById = (id) => CATEGORIES.find((c) => c.id === (ALIAS[id] || id)) || CATEGORIES[0];

import GEO_DATA from "./geo.json";
/* LGD hierarchy (02 Oct 2026): states, districts, tehsils and urban local bodies. Villages are typed in. */
export const GEO = GEO_DATA;
export const STATES = GEO.map((x) => x.name);
export const stateBy = (name) => GEO.find((x) => x.name.toLowerCase() === String(name || "").toLowerCase());
export const districtsOf = (state) => stateBy(state)?.districts || [];
export const tehsilsOf = (state, district) => districtsOf(state).find((d) => d.name === district)?.tehsils || [];
export const citiesOf = (state) => stateBy(state)?.cities || [];

export const SEVERITY = ["Low", "Medium", "High", "Critical"];
export const STATUSES = ["Open", "Acknowledged", "In progress", "Resolved"];
export const STATUS_TONE = { Open: "#FF7A2F", Acknowledged: "#3B3FD8", "In progress": "#F5B400", Resolved: "#13A86B" };

export function timeAgo(iso) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} hr ago`;
  const d = Math.round(h / 24); if (d < 30) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* Privacy guard: detect personal data people should not post publicly */
const PATTERNS = [
  [/(?:\+91[\s]?)?[6-9]\d{9}\b/g, "phone number"],
  [/[\w.+]+@[\w-]+\.[\w.]+/g, "email address"],
  [/\b\d{4}\s?\d{4}\s?\d{4}\b/g, "12 digit ID number"],
  [/\b[A-Z]{5}\d{4}[A-Z]\b/g, "PAN number"],
];
export function findPersonalData(text) {
  const hits = new Set();
  for (const [re, label] of PATTERNS) if (new RegExp(re.source, re.flags).test(text)) hits.add(label);
  return [...hits];
}
export function maskPersonalData(text) {
  return PATTERNS.reduce((t, [re]) => t.replace(new RegExp(re.source, re.flags), "[removed]"), text);
}
export const CONTACT = { email: "help@oneyouthoneindia.com", city: "Bengaluru (Bangalore), Karnataka, India", site: "www.oneyouthoneindia.com" };
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

/* Emergency and helpline numbers that work nationwide (state and district control rooms route locally). */
export const HELPLINES = [
  { n: "112", label: "Emergency response (police, fire, medical)", tone: "#E5484D", big: true },
  { n: "100", label: "Police control room" },
  { n: "101", label: "Fire and rescue" },
  { n: "108", label: "Ambulance and accident help" },
  { n: "102", label: "Ambulance (mother and child, many states)" },
  { n: "1077", label: "District control room (disaster)" },
  { n: "1070", label: "State emergency operation centre" },
  { n: "1091", label: "Women helpline (police)" },
  { n: "181", label: "Women helpline (many states)" },
  { n: "1098", label: "Child helpline" },
  { n: "1930", label: "Cyber fraud helpline" },
  { n: "14567", label: "Elder line for senior citizens" },
  { n: "1078", label: "NDMA disaster helpline" },
];

export const MAP_FINDERS = [
  { q: "police station", label: "Police stations", icon: "Siren" },
  { q: "government hospital", label: "Government hospitals", icon: "HeartPulse" },
  { q: "hospital", label: "All hospitals", icon: "HeartPulse" },
  { q: "fire station", label: "Fire stations", icon: "Flame" },
  { q: "district collector office", label: "Collector office", icon: "Landmark" },
  { q: "tehsil office", label: "Tehsil office", icon: "FileText" },
  { q: "municipal office", label: "Municipal office", icon: "Building2" },
  { q: "primary health centre", label: "Primary health centres", icon: "HeartPulse" },
  { q: "post office", label: "Post offices", icon: "Mail" },
  { q: "ration shop", label: "Ration shops", icon: "Wheat" },
];
export const mapsUrl = (q, place) => `https://www.google.com/maps/search/${encodeURIComponent(place ? `${q} in ${place}` : `${q} near me`)}`;
export const searchUrl = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

/* Voice typing languages (Web Speech API). Support varies by browser; Chrome supports the most. */
export const VOICE_LANGS = [
  ["en-IN", "English"], ["hi-IN", "हिन्दी Hindi"], ["bn-IN", "বাংলা Bengali"], ["te-IN", "తెలుగు Telugu"], ["mr-IN", "मराठी Marathi"],
  ["ta-IN", "தமிழ் Tamil"], ["gu-IN", "ગુજરાતી Gujarati"], ["kn-IN", "ಕನ್ನಡ Kannada"], ["ml-IN", "മലയാളം Malayalam"], ["pa-Guru-IN", "ਪੰਜਾਬੀ Punjabi"],
  ["or-IN", "ଓଡ଼ିଆ Odia"], ["ur-IN", "اردو Urdu"], ["as-IN", "অসমীয়া Assamese"], ["ne-IN", "नेपाली Nepali"],
];
export const langName = (code) => (VOICE_LANGS.find(([c]) => c === code)?.[1] || "").split(" ")[0];
