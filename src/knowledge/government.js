/* Government Administration Explorer: roles and structure, not named individuals.
 * Titles and service groups differ between States; each role lists common alternative names.
 * Officer names and contacts change often, so they are linked from the official directory
 * (igod.gov.in, maintained by the National Informatics Centre) instead of being copied here. */

export const GOV_SOURCES = {
  igodStates: { label: "Integrated Government Online Directory: State and UT governments", url: "https://igod.gov.in/sg/states" },
  igodDistricts: { label: "Integrated Government Online Directory: districts by State", url: "https://igod.gov.in/sg/district/states" },
  knowIndia: { label: "Know India: The Union, States, Local Government", url: "https://knowindia.india.gov.in/" },
  constitution: { label: "Constitution of India, official PDF (Legislative Department)", url: "https://www.legislative.gov.in/static/uploads/2025/07/c9fe9c9b6840524844316f74bb1c556c.pdf" },
};

export const KINDS = {
  elected: ["Elected representative", "#13A86B"],
  constitutional: ["Constitutional authority", "#3B3FD8"],
  statutory: ["Statutory body", "#0E7490"],
  judicial: ["Judiciary", "#7C3AED"],
  civil: ["Civil servant", "#FF7A2F"],
  support: ["Clerical, technical or support staff", "#B45309"],
  community: ["Community or honorary worker", "#D9467F"],
  body: ["Public body or assembly", "#6B7280"],
};

// Matches State and UT names regardless of capitalisation or a leading "The".
export const nameKey = (n) => String(n || "").toLowerCase().replace(/^the\s+/, "").replace(/\s+/g, " ").trim();
const UT_LIST = {
  "Andaman and Nicobar Islands": { head: "Lieutenant Governor", legislature: false },
  Chandigarh: { head: "Administrator (the Governor of Punjab)", legislature: false },
  "Dadra and Nagar Haveli and Daman and Diu": { head: "Administrator", legislature: false },
  Delhi: { head: "Lieutenant Governor", legislature: true },
  "Jammu and Kashmir": { head: "Lieutenant Governor", legislature: true },
  Ladakh: { head: "Lieutenant Governor", legislature: false },
  Lakshadweep: { head: "Administrator", legislature: false },
  Puducherry: { head: "Lieutenant Governor", legislature: true },
};
export const utInfo = (state) => Object.entries(UT_LIST).find(([k]) => nameKey(k) === nameKey(state))?.[1] || null;
export const UTS = UT_LIST;

const R = (id, title, kind, o = {}) => ({ id, title, kind, aka: [], group: null, appointed: null, reports: null, role: "", services: [], basis: null, ...o });

export const LEVELS = [
  { id: "union", name: "Union Government", scope: "All of India", roles: [
    R("president", "President of India", "constitutional", { basis: "Articles 52 to 62", appointed: "Elected by an electoral college of elected MPs and MLAs", role: "Head of State. Gives assent to laws, appoints the Prime Minister, Governors and judges, and can grant pardons.", services: ["Mercy petitions (Article 72)"] }),
    R("vp", "Vice President of India", "constitutional", { basis: "Articles 63 to 71", appointed: "Elected by members of both Houses of Parliament", role: "Ex officio Chairman of the Rajya Sabha." }),
    R("pm", "Prime Minister and Union Council of Ministers", "elected", { basis: "Articles 74 and 75", appointed: "Prime Minister appointed by the President; ministers on the PM's advice", reports: "Collectively responsible to the Lok Sabha", role: "Runs the Union Government and its ministries." }),
    R("mp", "Members of Parliament (Lok Sabha and Rajya Sabha)", "elected", { basis: "Articles 79 to 122", role: "Make Union laws, approve the budget and question the government.", services: ["Raise public issues in Parliament", "Recommend local works under the MP Local Area Development scheme"] }),
    R("sc", "Supreme Court of India", "judicial", { basis: "Articles 124 to 147", role: "Highest court; protects Fundamental Rights under Article 32 and hears appeals.", services: ["Writ petitions for Fundamental Rights"] }),
    R("eci", "Election Commission of India", "constitutional", { basis: "Article 324", role: "Conducts elections to Parliament, State Legislatures and the offices of President and Vice President.", services: ["Voter registration and voter ID"] }),
    R("cag", "Comptroller and Auditor General", "constitutional", { basis: "Article 148", role: "Audits the accounts of the Union and State governments." }),
    R("upsc", "Union Public Service Commission", "constitutional", { basis: "Article 315", role: "Recruits officers for All India and Central services, including the IAS and IPS." }),
    R("cic", "Central Information Commission", "statutory", { basis: "RTI Act, 2005", role: "Hears second appeals and complaints about Central public authorities under the RTI Act.", services: ["RTI second appeals and complaints"] }),
    R("cabsec", "Cabinet Secretary", "civil", { group: "Group A (IAS)", appointed: "Appointed by the Union Government", role: "Senior most civil servant; coordinates all ministries." }),
    R("secy", "Secretary to the Government of India", "civil", { group: "Group A", reports: "The Minister in charge", role: "Administrative head of a ministry or department." }),
    R("so", "Section Officer and Assistant Section Officer", "support", { group: "Group B", role: "Supervise file work and prepare notes for decisions in ministries." }),
    R("ldc", "Upper and Lower Division Clerks", "support", { group: "Group C", role: "Clerical work: receiving letters, maintaining files and records." }),
    R("mts", "Multi Tasking Staff", "support", { group: "Group C (formerly Group D)", role: "Office support: movement of files, upkeep and general assistance." }),
  ] },
  { id: "state", name: "State Government", scope: "Your State", roles: [
    R("governor", "Governor", "constitutional", { basis: "Articles 153 to 162", appointed: "Appointed by the President", role: "Constitutional head of the State. Gives assent to State laws and appoints the Chief Minister." }),
    R("cm", "Chief Minister and State Council of Ministers", "elected", { basis: "Articles 163 and 164", reports: "Collectively responsible to the Legislative Assembly", role: "Runs the State Government and its departments." }),
    R("mla", "Members of the Legislative Assembly (MLAs)", "elected", { basis: "Articles 168 to 212", role: "Make State laws, pass the State budget and question the State government.", services: ["Raise constituency issues in the Assembly"] }),
    R("hc", "High Court", "judicial", { basis: "Articles 214 to 231", role: "Highest court in the State; issues writs under Article 226.", services: ["Writ petitions", "Appeals from district courts"] }),
    R("sec", "State Election Commission", "constitutional", { basis: "Articles 243K and 243ZA", role: "Conducts Panchayat and Municipal elections." }),
    R("spsc", "State Public Service Commission", "constitutional", { basis: "Article 315", role: "Recruits officers for State services." }),
    R("sic", "State Information Commission", "statutory", { basis: "RTI Act, 2005", role: "Hears RTI second appeals and complaints about State public authorities.", services: ["RTI second appeals and complaints"] }),
    R("cs", "Chief Secretary", "civil", { group: "Group A (IAS)", reports: "The Chief Minister", role: "Head of the State civil service; coordinates all departments." }),
    R("dgp", "Director General of Police", "civil", { group: "Group A (IPS)", role: "Head of the State police force." }),
    R("ps", "Principal Secretaries and Secretaries", "civil", { group: "Group A", reports: "The Minister in charge", role: "Administrative heads of State departments such as revenue, health and education." }),
  ] },
  { id: "division", name: "Division", scope: "A group of districts (in many States)", roles: [
    R("divcom", "Divisional Commissioner", "civil", { aka: ["Revenue Divisional Commissioner", "Commissioner of Division"], group: "Group A (usually IAS)", reports: "State Government", role: "Supervises the Collectors and revenue administration of several districts; hears certain revenue appeals.", services: ["Revenue appeals"] }),
  ] },
  { id: "district", name: "District Administration", scope: "Your district", roles: [
    R("dm", "District Collector / District Magistrate", "civil", { aka: ["Deputy Commissioner"], group: "Group A (usually IAS)", reports: "Divisional Commissioner and State Government", role: "Head of the district administration: land revenue, law and order as District Magistrate, disaster management, elections as District Election Officer and coordination of schemes.", services: ["Public grievance hearings", "Arms licences", "Land and revenue appeals", "Disaster relief"] }),
    R("adm", "Additional District Magistrate", "civil", { aka: ["Additional Collector", "Additional Deputy Commissioner"], group: "Group A", reports: "District Collector", role: "Assists the Collector with revenue and magisterial work." }),
    R("sp", "Superintendent of Police", "civil", { aka: ["Senior Superintendent of Police", "Commissioner of Police (in commissionerate cities)"], group: "Group A (usually IPS)", role: "Heads the district police.", services: ["Complaints when a police station refuses to register an FIR"] }),
    R("zpceo", "Chief Executive Officer, Zila Parishad", "civil", { aka: ["CEO, District Panchayat"], group: "Group A", reports: "Zila Parishad and State Government", role: "Executive head of the district Panchayat; oversees rural development schemes." }),
    R("dj", "District and Sessions Judge", "judicial", { basis: "Article 233", role: "Heads the district judiciary for civil and criminal cases.", services: ["Civil suits", "Criminal trials", "Free legal aid via the District Legal Services Authority"] }),
    R("cmo", "Chief Medical Officer / District Health Officer", "civil", { group: "Group A", role: "Runs district public health services and hospitals.", services: ["Hospital services", "Disability and medical certificates"] }),
    R("deo", "District Education Officer", "civil", { aka: ["District Basic Education Officer"], group: "Group A or B (varies by State)", role: "Oversees government schools in the district.", services: ["School admission and RTE complaints"] }),
    R("dso", "District Supply Officer", "civil", { group: "Group B (varies by State)", role: "Public distribution system and ration cards.", services: ["Ration card issues"] }),
  ] },
  { id: "subdivision", name: "Sub Division", scope: "Part of a district", roles: [
    R("sdm", "Sub Divisional Magistrate", "civil", { aka: ["Sub Divisional Officer", "Revenue Divisional Officer", "Assistant Collector"], group: "Group A (IAS or State civil service)", reports: "District Collector", role: "Revenue and magisterial head of the sub division.", services: ["Certificates in many States (caste, income, domicile)", "Land disputes", "Magisterial inquiries"] }),
    R("sdpo", "Sub Divisional Police Officer", "civil", { aka: ["Deputy Superintendent of Police", "Assistant Superintendent of Police"], group: "Group A or B", reports: "Superintendent of Police", role: "Supervises police stations in the sub division." }),
  ] },
  { id: "tehsil", name: "Tehsil / Taluk / Mandal", scope: "Revenue unit below the district", roles: [
    R("tehsildar", "Tehsildar", "civil", { aka: ["Taluk Tahsildar", "Mamlatdar", "Mandal Revenue Officer"], group: "State revenue service (Group A or B, varies by State)", reports: "Sub Divisional Magistrate", role: "Revenue head of the tehsil: land records, revenue collection and executive magistrate duties.", services: ["Mutation of land records", "Income, caste and residence certificates", "Revenue court cases"] }),
    R("naib", "Naib Tehsildar", "civil", { aka: ["Deputy Tehsildar"], group: "Group B or C (varies by State)", reports: "Tehsildar", role: "Assists the Tehsildar with revenue cases and field verification." }),
    R("ri", "Revenue Inspector", "support", { aka: ["Kanungo", "Circle Inspector"], group: "Group C", reports: "Tehsildar", role: "Supervises village revenue officials and verifies land records." }),
    R("subreg", "Sub Registrar", "civil", { group: "Group B (varies by State)", role: "Registers property documents and marriages under the relevant laws.", services: ["Property registration", "Encumbrance certificates"] }),
    R("sho", "Station House Officer (police station)", "civil", { aka: ["Inspector", "Sub Inspector in charge"], group: "Group B or C", reports: "Sub Divisional Police Officer", role: "In charge of a police station.", services: ["Registering an FIR", "Police verification"] }),
  ] },
  { id: "block", name: "Block (Community Development Block)", scope: "Development unit of rural areas", roles: [
    R("bdo", "Block Development Officer", "civil", { group: "Group A or B (varies by State)", reports: "CEO, Zila Parishad", role: "Implements rural development schemes such as rural employment guarantee, rural housing and sanitation.", services: ["MGNREGA job cards and wage issues", "Rural housing scheme applications"] }),
    R("ps_chair", "Panchayat Samiti Chairperson", "elected", { aka: ["Block Pramukh", "Pradhan of Panchayat Samiti"], basis: "Article 243B", role: "Heads the intermediate level Panchayat." }),
    R("cdpo", "Child Development Project Officer", "civil", { group: "Group B (varies by State)", role: "Runs the ICDS project: Anganwadis, nutrition and pre school education." }),
    R("je", "Junior Engineer and Technical Assistants", "support", { group: "Group B or C", role: "Technical estimates and supervision of works such as roads and water supply." }),
  ] },
  { id: "urban", name: "Urban Local Bodies", scope: "Municipal Corporation, Municipal Council or Nagar Panchayat", roles: [
    R("mayor", "Mayor / Chairperson", "elected", { basis: "Article 243R", aka: ["Municipal President"], role: "Presides over the elected municipal body. Elected directly or by councillors depending on the State." }),
    R("councillor", "Ward Councillor / Corporator", "elected", { basis: "Article 243R", role: "Represents a ward in the municipal body.", services: ["Ward level issues: roads, drains, streetlights, garbage"] }),
    R("mc", "Municipal Commissioner", "civil", { aka: ["Chief Officer or Executive Officer in smaller towns"], group: "Group A (IAS in large cities)", reports: "State Government and the municipal body", role: "Executive head of the municipal administration.", services: ["Property tax", "Building permissions", "Trade licences", "Birth and death registration"] }),
    R("wo", "Ward Officer / Assistant Commissioner", "civil", { group: "Group A or B", reports: "Municipal Commissioner", role: "Runs municipal services in a zone or ward." }),
    R("si", "Sanitary Inspector, Health Inspector and Junior Engineers", "support", { group: "Group C", role: "Field supervision of sanitation, public health and civic works." }),
  ] },
  { id: "panchayat", name: "Panchayati Raj Institutions", scope: "Rural local self government (Part IX)", roles: [
    R("zp", "Zila Parishad Chairperson", "elected", { aka: ["Adhyaksha", "Zila Pramukh"], basis: "Article 243B", role: "Heads the district level Panchayat." }),
    R("sarpanch", "Sarpanch / Gram Pradhan", "elected", { aka: ["Mukhiya", "Gram Panchayat President"], basis: "Article 243B", role: "Heads the Gram Panchayat.", services: ["Village development plans", "Local certificates in some States"] }),
    R("panch", "Ward Member / Panch", "elected", { basis: "Article 243C", role: "Represents a ward in the Gram Panchayat." }),
    R("gramsabha", "Gram Sabha", "body", { basis: "Article 243A", role: "All registered voters of the village. Approves plans and beneficiary lists and conducts social audits.", services: ["Social audit of schemes"] }),
    R("pdo", "Panchayat Secretary", "civil", { aka: ["Panchayat Development Officer", "Gram Sevak", "Village Development Officer"], group: "Group C", reports: "Block Development Officer", role: "Keeps Gram Panchayat records and implements decisions.", services: ["Birth and death records in many States", "Scheme applications"] }),
  ] },
  { id: "village", name: "Village", scope: "Revenue village", roles: [
    R("vro", "Village Revenue Officer", "support", { aka: ["Patwari", "Lekhpal", "Talathi", "Village Administrative Officer", "Village Accountant"], group: "Group C", reports: "Revenue Inspector or Tehsildar", role: "Maintains land records for the village and verifies details for certificates.", services: ["Land record extracts", "Field verification for certificates"] }),
    R("anganwadi", "Anganwadi Worker and Helper", "community", { role: "Honorary workers under ICDS providing nutrition, pre school education and health referrals. Not regular government employees.", services: ["Supplementary nutrition", "Child growth monitoring"] }),
    R("asha", "ASHA (Accredited Social Health Activist)", "community", { role: "Community health worker paid incentives under the National Health Mission. Not a regular government employee.", services: ["Maternal and child health support", "Referrals to health centres"] }),
  ] },
];

export const GOV_NOTE = "Titles, service groups and who issues certificates vary between States. This explorer describes the usual structure. For current officers and official contacts, use the official directory linked for each State and district.";
