/* Right to Information Act, 2005: plain language guide and deadline rules.
 * Summaries are explanations, not the legal text. Fees and forms for State public authorities
 * are set by each State's RTI rules and can differ from the Central figures shown here. */

export const RTI_SOURCES = {
  portal: { label: "RTI Online (Central Government)", url: "https://rtionline.gov.in/" },
  dopt: { label: "RTI portal, Department of Personnel and Training", url: "https://rti.gov.in/" },
  cic: { label: "Central Information Commission", url: "https://cic.gov.in/" },
  act: { label: "India Code: Right to Information Act, 2005", url: "https://www.indiacode.nic.in/" },
};

export const RTI_SECTIONS = [
  ["Section 2(f)", "What counts as information", "Any material in any form held by a public authority: records, documents, file notings, emails, opinions, advice, orders, circulars, contracts, samples, models and electronic data."],
  ["Section 2(h)", "Public authority", "Bodies set up by or under the Constitution or a law, and bodies owned, controlled or substantially financed by government, including NGOs substantially financed by government."],
  ["Section 3", "Who can ask", "All citizens have the right to information, subject to the Act."],
  ["Section 4", "Proactive disclosure", "Public authorities must publish key information themselves, such as their functions, officers' duties, budgets, rules and how to reach the PIO."],
  ["Section 5", "PIO and APIO", "Every public authority must designate Public Information Officers. Assistant PIOs receive applications at sub divisional or sub district level and forward them."],
  ["Section 6", "Making a request", "Apply in writing or electronically, in English, Hindi or the official language of the area, with the prescribed fee. You do not have to give a reason or any personal details other than those needed to contact you. If the application is for another authority, it must be transferred within 5 days."],
  ["Section 7", "Time limits and fees", "The PIO must reply within 30 days, or within 48 hours if the information concerns someone's life or liberty. Below poverty line applicants pay no fee. If the PIO misses the deadline, the information must be provided free of charge."],
  ["Section 8", "Exemptions", "Information can be withheld only on specified grounds, for example harm to sovereignty or security, contempt of court, breach of Parliament's privilege, commercial confidence, information received in a fiduciary relationship, endangering someone's safety, impeding an investigation, cabinet papers before a decision, and unwarranted invasion of personal privacy. Information that cannot be denied to Parliament or a State Legislature cannot be denied to a citizen."],
  ["Section 11", "Third party information", "If the information relates to a third party who treated it as confidential, the PIO must give them a chance to object. The overall time limit becomes 40 days."],
  ["Section 18", "Complaints", "You can complain directly to the Information Commission if no PIO has been appointed, your application was refused, you got no reply in time, the fee demanded was unreasonable, or the information given was incomplete, misleading or false."],
  ["Section 19", "Appeals", "First appeal to the First Appellate Authority (a senior officer in the same authority) within 30 days. Second appeal to the Central or State Information Commission within 90 days of the first appeal decision or the date it was due."],
  ["Section 20", "Penalties", "The Information Commission can fine a PIO ₹250 per day of delay, up to ₹25,000, for refusing an application without reasonable cause, delay, or giving false information, and can recommend disciplinary action."],
  ["Section 24", "Exempt organisations", "Intelligence and security organisations listed in the Second Schedule are exempt, except for information about allegations of corruption and human rights violations."],
];

export const RTI_FEES = [
  ["Application fee (Central public authorities)", "₹10 per application"],
  ["Below poverty line applicants", "No fee, with a copy of the BPL certificate"],
  ["Photocopies (Central)", "₹2 per page of A4 or A3 size"],
  ["First appeal (Central)", "No fee"],
  ["Second appeal to the Central Information Commission", "No fee"],
  ["State public authorities", "Set by each State's RTI rules; check your State portal or Information Commission"],
];

export const RTI_TIMELINE = [
  ["Reply from PIO", "30 days", "From receipt of your application (Section 7(1))"],
  ["Life or liberty", "48 hours", "When the information concerns someone's life or liberty"],
  ["Filed through an APIO", "+5 days", "Added when the application is submitted to an Assistant PIO"],
  ["Third party involved", "40 days", "When third party information is involved (Section 11)"],
  ["First appeal", "within 30 days", "From the reply, or from the date the reply was due"],
  ["First appeal decision", "30 days, at most 45", "First Appellate Authority must decide (Section 19(6))"],
  ["Second appeal", "within 90 days", "From the first appeal order, or the date it was due (Section 19(3))"],
];

export const RTI_STEPS = [
  ["Identify the authority", "Find the public authority that holds the information. Central ministries and their bodies are on RTI Online; State departments use their State's portal or a written application."],
  ["Write specific questions", "Ask for specific records, for a clear period. Avoid asking why or for opinions; ask for documents, file notings, dates and names of officers."],
  ["Pay the fee and submit", "Pay the fee online or by IPO, demand draft or court fee stamp as the rules allow. Keep proof of submission and the date."],
  ["Track the deadline", "Note the date your application was received. The reply is due in 30 days in most cases."],
  ["Appeal if needed", "If there is no reply, a refusal or an incomplete answer, file a first appeal within 30 days, then a second appeal to the Information Commission within 90 days."],
];

const addDays = (iso, n) => { if (!iso) return null; const d = new Date(`${iso}T00:00:00`); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
export const daysBetween = (fromIso, toIso) => Math.round((new Date(`${toIso}T00:00:00`) - new Date(`${fromIso}T00:00:00`)) / 864e5);

/* Deadline calculator. Dates are ISO strings (YYYY-MM-DD). Returns the key due dates and
 * the next action. These are guides based on the Act; check the exact receipt dates on your records. */
export function rtiDeadlines(r, today = new Date().toISOString().slice(0, 10)) {
  const filed = r.filed_on;
  let replyDue = null;
  if (filed) {
    if (r.life_liberty) replyDue = addDays(filed, 2);
    else replyDue = addDays(filed, (r.third_party ? 40 : 30) + (r.via_apio ? 5 : 0));
  }
  const replyBase = r.reply_on || replyDue;
  const firstAppealBy = replyBase ? addDays(replyBase, 30) : null;
  const faDecisionDue = r.fa_filed_on ? addDays(r.fa_filed_on, 30) : null;
  const faDecisionMax = r.fa_filed_on ? addDays(r.fa_filed_on, 45) : null;
  const secondAppealBy = r.fa_order_on ? addDays(r.fa_order_on, 90) : faDecisionDue ? addDays(faDecisionDue, 90) : null;

  let next;
  if (!filed) next = { stage: "draft", text: "Add the date your application was filed", due: null };
  else if (r.status === "closed") next = { stage: "closed", text: "Closed", due: null };
  else if (r.sa_filed_on) next = { stage: "second_appeal", text: "Second appeal filed with the Information Commission", due: null };
  else if (r.fa_order_on || (r.fa_filed_on && today > faDecisionMax)) next = { stage: "second_appeal_window", text: "File a second appeal if you are not satisfied", due: secondAppealBy };
  else if (r.fa_filed_on) next = { stage: "first_appeal", text: "Waiting for the first appeal decision", due: faDecisionDue };
  else if (r.reply_on) next = { stage: "reply_received", text: "Reply received. File a first appeal if it is incomplete or refused", due: firstAppealBy };
  else if (today > replyDue) next = { stage: "overdue", text: "No reply in time: you can file a first appeal now", due: firstAppealBy };
  else next = { stage: "awaiting_reply", text: "Waiting for the PIO's reply", due: replyDue };
  const daysLeft = next.due ? daysBetween(today, next.due) : null;
  return { replyDue, firstAppealBy, faDecisionDue, faDecisionMax, secondAppealBy, next, daysLeft };
}

/* Drafting assistant: builds a plain RTI application from the form fields. */
export function draftRti(f) {
  const lines = [];
  const lvl = f.level === "state" ? `${f.state || "[State]"} State` : "Central";
  lines.push("To,", "The Public Information Officer,", f.authority || "[Name of the public authority]", ...(f.address ? f.address.split("\n") : ["[Address]"]), "");
  lines.push(`Subject: Request for information under Section 6(1) of the Right to Information Act, 2005${f.subject ? `, regarding ${f.subject}` : ""}`, "");
  lines.push("Sir / Madam,", "", `I request the following information${f.period ? ` for the period ${f.period}` : ""}:`, "");
  (f.questions || []).filter((q) => q.trim()).forEach((q, i) => lines.push(`${i + 1}. ${q.trim()}`));
  lines.push("");
  if (f.lifeLiberty) lines.push("This information concerns the life or liberty of a person. I request that it be provided within 48 hours as required by the proviso to Section 7(1).", "");
  lines.push(f.mode === "inspection" ? "I wish to inspect the relevant records and then obtain copies of selected documents." : f.mode === "email" ? "Please provide the information by email, in electronic form, where available." : "Please provide certified copies of the documents.");
  lines.push("");
  if (f.bpl) lines.push("I belong to the Below Poverty Line category. A copy of my BPL certificate is enclosed, so no fee is payable under Section 7(5).");
  else lines.push(`I have paid the application fee as per the ${lvl} RTI rules${f.feeRef ? ` (reference: ${f.feeRef})` : ""}. I am willing to pay any further fee for copies as per the rules.`);
  lines.push("", "If any part of this information is held by another public authority, please transfer the application under Section 6(3) and inform me.", "");
  lines.push("I am a citizen of India.", "", "Yours faithfully,", "", f.name || "[Your name]", ...(f.applicantAddress ? f.applicantAddress.split("\n") : ["[Your address]"]), f.phone ? `Phone: ${f.phone}` : "", f.email ? `Email: ${f.email}` : "", `Date: ${f.date || new Date().toLocaleDateString("en-IN")}`, `Place: ${f.place || "[Place]"}`);
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
}
