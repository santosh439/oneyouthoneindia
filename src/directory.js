/* Government of India website directory.
 * Sources: the Integrated Government Online Directory (igod.gov.in, by NIC), the Government of Sikkim
 * web directory of State portals (updated 12 Oct 2026) and the organisations' own websites.
 * ok: true = address opened or confirmed from an official listing on 13 Oct 2026.
 * Every address is re-tested weekly by scripts/check-links.mjs (GitHub Actions "Link check"). */

export const CHECKED_ON = "13 October 2026";
export const SECTORS = ["Governance", "Economy and finance", "Agriculture and rural", "Health and welfare", "Education and skills", "Infrastructure and transport", "Energy and resources", "Industry and trade", "Science and technology", "Security and external", "Culture and society"];

const u = (name, url, o = {}) => ({ name, url, ...o });

export const START = [
  u("National Portal of India", "https://www.india.gov.in", { ok: true, note: "Single window to government information and services" }),
  u("Government website directory (NIC)", "https://igod.gov.in", { ok: true, note: "Official directory of every government website" }),
  u("Prime Minister's Office", "https://www.pmindia.gov.in", { ok: true }),
  u("President of India", "https://presidentofindia.gov.in", { ok: true }),
  u("Vice President of India", "https://vicepresidentofindia.nic.in", { ok: true }),
  u("Parliament of India (Sansad)", "https://sansad.in"),
  u("Supreme Court of India", "https://www.sci.gov.in"),
  u("India Code: all Central and State Acts", "https://www.indiacode.nic.in", { ok: true }),
  u("MyGov citizen engagement", "https://www.mygov.in", { ok: true }),
  u("Open Government Data", "https://data.gov.in"),
];

export const SERVICES = [
  u("CPGRAMS: public grievances", "https://pgportal.gov.in", { tag: "Complaints", note: "File a grievance with any Central ministry" }),
  u("RTI Online", "https://rtionline.gov.in", { tag: "Complaints", note: "RTI to Central public authorities" }),
  u("National Cyber Crime Reporting", "https://cybercrime.gov.in", { tag: "Complaints", note: "Report online fraud and cyber crime (helpline 1930)" }),
  u("National Consumer Helpline", "https://consumerhelpline.gov.in", { tag: "Complaints" }),
  u("e-Courts services", "https://ecourts.gov.in", { tag: "Justice", note: "Case status, cause lists, orders" }),
  u("National Legal Services Authority", "https://nalsa.gov.in", { tag: "Justice", note: "Free legal aid" }),
  u("Aadhaar (UIDAI)", "https://uidai.gov.in", { tag: "Identity" }),
  u("Passport Seva", "https://www.passportindia.gov.in", { tag: "Identity" }),
  u("Voter services (Election Commission)", "https://voters.eci.gov.in", { tag: "Identity", note: "Register, correct details, find your polling booth" }),
  u("DigiLocker", "https://www.digilocker.gov.in", { tag: "Identity", note: "Digital copies of official documents" }),
  u("UMANG app", "https://web.umang.gov.in", { tag: "Identity", note: "Many Central and State services in one app" }),
  u("Income Tax e-filing", "https://www.incometax.gov.in", { tag: "Money" }),
  u("GST portal", "https://www.gst.gov.in", { tag: "Money" }),
  u("EPFO (Provident Fund)", "https://www.epfindia.gov.in", { tag: "Work" }),
  u("e-Shram (unorganised workers)", "https://eshram.gov.in", { tag: "Work" }),
  u("National Scholarship Portal", "https://scholarships.gov.in", { tag: "Education" }),
  u("PM-KISAN", "https://pmkisan.gov.in", { tag: "Farmers" }),
  u("Ayushman Bharat PM-JAY", "https://pmjay.gov.in", { tag: "Health" }),
  u("Parivahan: driving licence and vehicles", "https://parivahan.gov.in", { tag: "Transport" }),
];

export const BODIES = [
  u("Election Commission of India", "https://eci.gov.in", { kind: "Constitutional" }),
  u("Union Public Service Commission", "https://upsc.gov.in", { kind: "Constitutional" }),
  u("Comptroller and Auditor General", "https://cag.gov.in", { kind: "Constitutional" }),
  u("Central Information Commission", "https://cic.gov.in", { kind: "Statutory" }),
  u("Central Vigilance Commission", "https://cvc.gov.in", { kind: "Statutory" }),
  u("Lokpal of India", "https://lokpal.gov.in", { kind: "Statutory" }),
  u("National Human Rights Commission", "https://nhrc.nic.in", { kind: "Statutory" }),
  u("National Commission for Women", "https://ncw.gov.in", { kind: "Statutory", ok: true }),
  u("National Commission for Scheduled Castes", "https://ncsc.nic.in", { kind: "Constitutional" }),
  u("National Commission for Scheduled Tribes", "https://ncst.nic.in", { kind: "Constitutional" }),
  u("National Commission for Backward Classes", "https://ncbc.nic.in", { kind: "Constitutional" }),
  u("National Commission for Protection of Child Rights", "https://ncpcr.gov.in", { kind: "Statutory" }),
  u("NITI Aayog", "https://www.niti.gov.in", { kind: "Policy" }),
  u("Reserve Bank of India", "https://www.rbi.org.in", { kind: "Regulator" }),
  u("Securities and Exchange Board of India", "https://www.sebi.gov.in", { kind: "Regulator" }),
  u("Telecom Regulatory Authority of India", "https://www.trai.gov.in", { kind: "Regulator" }),
  u("Food Safety and Standards Authority", "https://www.fssai.gov.in", { kind: "Regulator" }),
];

// Union ministries with their departments. [name, url, sector, departments?, ok?]
const M = (name, url, sector, departments = [], ok = false) => ({ name, url, sector, departments, ok });
const D = (name, url, ok = false) => ({ name, url, ok });
export const MINISTRIES = [
  M("Agriculture and Farmers Welfare", "https://agriwelfare.gov.in", "Agriculture and rural", [D("Agricultural Research and Education", "https://dare.gov.in")]),
  M("AYUSH", "https://ayush.gov.in", "Health and welfare"),
  M("Chemicals and Fertilizers", "https://chemicals.gov.in", "Industry and trade", [D("Fertilizers", "https://fert.gov.in"), D("Pharmaceuticals", "https://pharmaceuticals.gov.in")]),
  M("Civil Aviation", "https://www.civilaviation.gov.in", "Infrastructure and transport"),
  M("Coal", "https://coal.gov.in", "Energy and resources"),
  M("Commerce and Industry", "https://commerce.gov.in", "Industry and trade", [D("Promotion of Industry and Internal Trade", "https://dpiit.gov.in")]),
  M("Communications", "https://dot.gov.in", "Science and technology", [D("Posts (India Post)", "https://www.indiapost.gov.in")]),
  M("Consumer Affairs, Food and Public Distribution", "https://consumeraffairs.nic.in", "Health and welfare", [D("Food and Public Distribution", "https://dfpd.gov.in")]),
  M("Cooperation", "https://www.cooperation.gov.in", "Agriculture and rural"),
  M("Corporate Affairs", "https://www.mca.gov.in", "Economy and finance"),
  M("Culture", "https://www.indiaculture.gov.in", "Culture and society"),
  M("Defence", "https://www.mod.gov.in", "Security and external"),
  M("Development of North Eastern Region", "https://mdoner.gov.in", "Governance"),
  M("Earth Sciences", "https://moes.gov.in", "Science and technology"),
  M("Education", "https://www.education.gov.in", "Education and skills"),
  M("Electronics and Information Technology", "https://www.meity.gov.in", "Science and technology", [], true),
  M("Environment, Forest and Climate Change", "https://moef.gov.in", "Energy and resources", [], true),
  M("External Affairs", "https://www.mea.gov.in", "Security and external"),
  M("Finance", "https://finmin.gov.in", "Economy and finance", [D("Economic Affairs", "https://dea.gov.in"), D("Revenue", "https://dor.gov.in"), D("Expenditure", "https://doe.gov.in"), D("Financial Services", "https://financialservices.gov.in"), D("Investment and Public Asset Management", "https://dipam.gov.in")]),
  M("Fisheries, Animal Husbandry and Dairying", "https://dof.gov.in", "Agriculture and rural", [D("Animal Husbandry and Dairying", "https://dahd.gov.in", true)], true),
  M("Food Processing Industries", "https://www.mofpi.gov.in", "Industry and trade"),
  M("Health and Family Welfare", "https://www.mohfw.gov.in", "Health and welfare", [D("Health Research", "https://dhr.gov.in")]),
  M("Heavy Industries", "https://heavyindustries.gov.in", "Industry and trade"),
  M("Home Affairs", "https://www.mha.gov.in", "Security and external", [], true),
  M("Housing and Urban Affairs", "https://mohua.gov.in", "Infrastructure and transport"),
  M("Information and Broadcasting", "https://mib.gov.in", "Culture and society"),
  M("Jal Shakti (Water Resources)", "https://jalshakti-dowr.gov.in", "Energy and resources", [D("Drinking Water and Sanitation", "https://jalshakti-ddws.gov.in")]),
  M("Labour and Employment", "https://labour.gov.in", "Health and welfare"),
  M("Law and Justice", "https://lawmin.gov.in", "Governance", [D("Legal Affairs", "https://legalaffairs.gov.in"), D("Legislative Department", "https://legislative.gov.in", true), D("Justice", "https://doj.gov.in")]),
  M("Micro, Small and Medium Enterprises", "https://msme.gov.in", "Industry and trade"),
  M("Mines", "https://mines.gov.in", "Energy and resources"),
  M("Minority Affairs", "https://www.minorityaffairs.gov.in", "Culture and society"),
  M("New and Renewable Energy", "https://mnre.gov.in", "Energy and resources"),
  M("Panchayati Raj", "https://panchayat.gov.in", "Agriculture and rural"),
  M("Parliamentary Affairs", "https://mpa.gov.in", "Governance"),
  M("Personnel, Public Grievances and Pensions", "https://dopt.gov.in", "Governance", [D("Administrative Reforms and Public Grievances", "https://darpg.gov.in"), D("Pension and Pensioners' Welfare", "https://doppw.gov.in")]),
  M("Petroleum and Natural Gas", "https://mopng.gov.in", "Energy and resources"),
  M("Ports, Shipping and Waterways", "https://shipmin.gov.in", "Infrastructure and transport"),
  M("Power", "https://powermin.gov.in", "Energy and resources"),
  M("Railways", "https://indianrailways.gov.in", "Infrastructure and transport"),
  M("Road Transport and Highways", "https://morth.gov.in", "Infrastructure and transport"),
  M("Rural Development", "https://rural.gov.in", "Agriculture and rural", [D("Land Resources", "https://dolr.gov.in")]),
  M("Science and Technology", "https://dst.gov.in", "Science and technology", [D("Biotechnology", "https://dbtindia.gov.in"), D("Scientific and Industrial Research", "https://www.dsir.gov.in")]),
  M("Skill Development and Entrepreneurship", "https://www.msde.gov.in", "Education and skills"),
  M("Social Justice and Empowerment", "https://socialjustice.gov.in", "Health and welfare", [D("Empowerment of Persons with Disabilities", "https://depwd.gov.in")], true),
  M("Statistics and Programme Implementation", "https://mospi.gov.in", "Economy and finance", [], true),
  M("Steel", "https://steel.gov.in", "Industry and trade"),
  M("Textiles", "https://texmin.gov.in", "Industry and trade", [], true),
  M("Tourism", "https://tourism.gov.in", "Culture and society"),
  M("Tribal Affairs", "https://tribal.gov.in", "Health and welfare", [], true),
  M("Women and Child Development", "https://wcd.gov.in", "Health and welfare", [], true),
  M("Youth Affairs and Sports", "https://yas.gov.in", "Education and skills"),
  M("Department of Atomic Energy", "https://dae.gov.in", "Science and technology"),
  M("Department of Space (ISRO)", "https://www.isro.gov.in", "Science and technology"),
];

// All 28 States and 8 UTs. [code, name, portal, ok]
export const STATE_PORTALS = [
  ["AP", "Andhra Pradesh", "https://www.ap.gov.in", true], ["AR", "Arunachal Pradesh", "https://www.arunachalpradesh.gov.in", true], ["AS", "Assam", "https://assam.gov.in", true],
  ["BR", "Bihar", "https://state.bihar.gov.in", true], ["CG", "Chhattisgarh", "https://cgstate.gov.in", true], ["GA", "Goa", "https://www.goa.gov.in", true],
  ["GJ", "Gujarat", "https://gujaratindia.gov.in", true], ["HR", "Haryana", "https://www.haryana.gov.in", true], ["HP", "Himachal Pradesh", "https://himachal.nic.in", true],
  ["JH", "Jharkhand", "https://www.jharkhand.gov.in", true], ["KA", "Karnataka", "https://www.karnataka.gov.in", true], ["KL", "Kerala", "https://kerala.gov.in", true],
  ["MP", "Madhya Pradesh", "https://www.mp.gov.in", true], ["MH", "Maharashtra", "https://www.maharashtra.gov.in", true], ["MN", "Manipur", "https://manipur.gov.in", true],
  ["ML", "Meghalaya", "https://meghalaya.gov.in", true], ["MZ", "Mizoram", "https://mizoram.gov.in", true], ["NL", "Nagaland", "https://www.nagaland.gov.in"],
  ["OD", "Odisha", "https://www.odisha.gov.in", true], ["PB", "Punjab", "https://punjab.gov.in", true], ["RJ", "Rajasthan", "https://rajasthan.gov.in", true],
  ["SK", "Sikkim", "https://www.sikkim.gov.in", true], ["TN", "Tamil Nadu", "https://www.tn.gov.in", true], ["TS", "Telangana", "https://www.telangana.gov.in", true],
  ["TR", "Tripura", "https://tripura.gov.in", true], ["UP", "Uttar Pradesh", "https://up.gov.in", true], ["UK", "Uttarakhand", "https://uk.gov.in", true],
  ["WB", "West Bengal", "https://wb.gov.in", true],
  ["AN", "Andaman and Nicobar Islands", "https://www.andaman.gov.in", false, "ut"], ["CH", "Chandigarh", "https://chandigarh.gov.in", true, "ut"],
  ["DH", "Dadra and Nagar Haveli and Daman and Diu", "https://ddd.gov.in", false, "ut"], ["DL", "Delhi", "https://delhi.gov.in", false, "ut"],
  ["JK", "Jammu and Kashmir", "https://jk.gov.in", true, "ut"], ["LA", "Ladakh", "https://ladakh.gov.in", true, "ut"],
  ["LD", "Lakshadweep", "https://lakshadweep.gov.in", false, "ut"], ["PY", "Puducherry", "https://py.gov.in", true, "ut"],
].map(([code, name, url, ok, type]) => ({ code, name, url, ok: !!ok, type: type || "state" }));

export const DISTRICTS_URL = "https://igod.gov.in/sg/district/states";
export const allLinks = () => [...START, ...SERVICES, ...BODIES, ...MINISTRIES.flatMap((m) => [m, ...m.departments]), ...STATE_PORTALS];

const CHECKED_ISO = "2026-10-13";
const isGov = (u) => /^https:\/\/([a-z0-9-]+\.)*(gov|nic)\.in(\/|$)/i.test(u || "");

/* Official government organisations from the site's checked directory (src/directory.js).
 * Each keeps its official website as the source; only addresses checked by hand are marked verified. */
export function officialOrgRows() {
  const row = (name, url, ok, extra = {}) => ({ name, sector: "government", website: url, source_label: "Official website (listed in the NIC government directory)", source_url: url, verified: !!ok, verified_at: ok ? CHECKED_ISO : "", ...extra });
  return [
    ...MINISTRIES.flatMap((m) => [row(/^Department/.test(m.name) ? m.name : `Ministry of ${m.name}`, m.url, m.ok, { category: m.sector }), ...m.departments.map((d) => row(`Department of ${d.name}`, d.url, d.ok, { category: m.sector }))]),
    ...STATE_PORTALS.map((s) => row(`Government of ${s.name}`, s.url, s.ok, { state: s.name, category: s.type === "ut" ? "Union Territory administration" : "State government" })),
    ...BODIES.filter((b) => isGov(b.url)).map((b) => row(b.name, b.url, b.ok, { category: b.kind })),
  ];
}

