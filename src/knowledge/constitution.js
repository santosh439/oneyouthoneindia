/* Constitution of India: plain language knowledge base.
 * Summaries are explanations in simple words, NOT the legal text. The authoritative text is
 * the official Constitution published by the Legislative Department, Ministry of Law and Justice.
 * Editors review each entry in Admin > Website content > Knowledge base before it is marked verified. */

export const OFFICIAL = {
  constitution: { label: "Constitution of India, official PDF (Legislative Department)", url: "https://www.legislative.gov.in/static/uploads/2025/07/c9fe9c9b6840524844316f74bb1c556c.pdf" },
  regional: { label: "Constitution in regional languages (Legislative Department)", url: "https://legislative.gov.in/?p=12893" },
  indiaCode: { label: "India Code (Ministry of Law and Justice)", url: "https://www.indiacode.nic.in/" },
  knowIndia: { label: "Know India: The Polity (Government of India)", url: "https://knowindia.india.gov.in/" },
};
const C = OFFICIAL.constitution;

/* Direct links to the official PDF files (each one opened and checked on 13 October 2026).
 * The Legislative Department's listing page loads slowly or appears blank in some browsers,
 * so the library links straight to the files on its servers. [language, detail, edition, url] */
export const LIBRARY = [
  ["English", "Full text of the Constitution of India", "As on 1 May 2026 · up to the 106th Amendment", "https://www.legislative.gov.in/static/uploads/2025/07/c9fe9c9b6840524844316f74bb1c556c.pdf"],
  ["हिन्दी Hindi + English", "Official Hindi text alongside the English (diglot)", "2026 edition · up to the 106th Amendment", "https://www.legislative.gov.in/static/uploads/2025/08/575648bd8ecb7654db902b93115d35e4.pdf"],
  ["தமிழ் Tamil", "Official Tamil translation, 5th edition", "As amended up to 31 October 2025", "https://cdnbbsr.s3waas.gov.in/s380537a945c7aaa788ccfcdf1b99b5d8f/uploads/2025/08/20251202579105693.pdf"],
  ["ಕನ್ನಡ Kannada + English", "English and Kannada side by side, 4th edition", "Published 2025", "https://www.legislative.gov.in/static/uploads/2025/07/359f70a69695affb9d72f8393102bd2e.pdf"],
  ["অসমীয়া Assamese", "Official Assamese translation, 3rd edition", "As on September 2025", "https://cdnbbsr.s3waas.gov.in/s380537a945c7aaa788ccfcdf1b99b5d8f/uploads/2025/08/20250926396642338.pdf"],
  ["बर' Bodo", "First edition in Bodo", "As on November 2025", "https://cdnbbsr.s3waas.gov.in/s380537a945c7aaa788ccfcdf1b99b5d8f/uploads/2025/11/20251216834989982.pdf"],
  ["Santhali", "First edition in Santhali (Ol Chiki script)", "As on November 2025", "https://www.legislative.gov.in/static/uploads/2025/12/aa187bd277347972681116b208a267e2.pdf"],
  ["मैथिली Maithili", "First edition in Maithili", "As on 1 May 2024", "https://cdnbbsr.s3waas.gov.in/s380537a945c7aaa788ccfcdf1b99b5d8f/uploads/2024/11/20241128416743979.pdf"],
];
export const LIBRARY_MORE = { label: "All other languages and Amendment Acts (official list)", note: "This government page can be slow and may look blank while it loads.", url: "https://legislative.gov.in/constitution-of-india" };

export const PREAMBLE = "WE, THE PEOPLE OF INDIA, having solemnly resolved to constitute India into a SOVEREIGN SOCIALIST SECULAR DEMOCRATIC REPUBLIC and to secure to all its citizens: JUSTICE, social, economic and political; LIBERTY of thought, expression, belief, faith and worship; EQUALITY of status and of opportunity; and to promote among them all FRATERNITY assuring the dignity of the individual and the unity and integrity of the Nation; IN OUR CONSTITUENT ASSEMBLY this twenty-sixth day of November, 1949, do HEREBY ADOPT, ENACT AND GIVE TO OURSELVES THIS CONSTITUTION.";

export const PARTS = [
  ["I", "The Union and its Territory", "1 to 4"], ["II", "Citizenship", "5 to 11"], ["III", "Fundamental Rights", "12 to 35"],
  ["IV", "Directive Principles of State Policy", "36 to 51"], ["IVA", "Fundamental Duties", "51A"], ["V", "The Union", "52 to 151"],
  ["VI", "The States", "152 to 237"], ["VIII", "The Union Territories", "239 to 242"], ["IX", "The Panchayats", "243 to 243O"],
  ["IXA", "The Municipalities", "243P to 243ZG"], ["IXB", "The Co-operative Societies", "243ZH to 243ZT"], ["X", "The Scheduled and Tribal Areas", "244 to 244A"],
  ["XI", "Relations between the Union and the States", "245 to 263"], ["XII", "Finance, Property, Contracts and Suits", "264 to 300A"],
  ["XIII", "Trade, Commerce and Intercourse within India", "301 to 307"], ["XIV", "Services under the Union and the States", "308 to 323"],
  ["XIVA", "Tribunals", "323A to 323B"], ["XV", "Elections", "324 to 329A"], ["XVI", "Special Provisions relating to certain Classes", "330 to 342A"],
  ["XVII", "Official Language", "343 to 351"], ["XVIII", "Emergency Provisions", "352 to 360"], ["XIX", "Miscellaneous", "361 to 367"],
  ["XX", "Amendment of the Constitution", "368"], ["XXI", "Temporary, Transitional and Special Provisions", "369 to 392"],
  ["XXII", "Short title, Commencement, Authoritative Hindi text and Repeals", "393 to 395"],
];
export const PARTS_NOTE = "Part VII was repealed by the Constitution (Seventh Amendment) Act, 1956.";

export const SCHEDULES = [
  ["First", "Names of the States and Union Territories and their territories."],
  ["Second", "Salaries and allowances of the President, Governors, Speakers, Judges of the Supreme Court and High Courts, and the Comptroller and Auditor General."],
  ["Third", "Forms of oaths and affirmations for ministers, legislators, judges and others."],
  ["Fourth", "Allocation of Rajya Sabha seats to the States and Union Territories."],
  ["Fifth", "Administration and control of Scheduled Areas and Scheduled Tribes."],
  ["Sixth", "Administration of tribal areas in Assam, Meghalaya, Tripura and Mizoram (autonomous district councils)."],
  ["Seventh", "Division of law making powers: Union List, State List and Concurrent List."],
  ["Eighth", "The 22 languages recognised by the Constitution."],
  ["Ninth", "Laws protected from certain court challenges, added by the First Amendment, 1951 (mostly land reform laws). Laws added after 24 April 1973 can still be reviewed by courts."],
  ["Tenth", "Disqualification of legislators on grounds of defection (anti defection law), added in 1985."],
  ["Eleventh", "29 subjects that may be given to Panchayats, added by the 73rd Amendment."],
  ["Twelfth", "18 subjects that may be given to Municipalities, added by the 74th Amendment."],
];

// kind: right | duty | dpsp | other. group is used for filtering on the Know your rights dashboard.
const A = (id, art, title, group, summary, example, extra = {}) => ({ id, art, title, group, summary, example, kind: "right", source: C, ...extra });
export const ARTICLES = [
  A("art-14", "Article 14", "Equality before law", "Right to Equality", "The State must treat everyone equally before the law and give everyone the equal protection of the laws. Different treatment is allowed only when there is a reasonable basis connected to a fair purpose.", "A government office cannot follow one rule for you and a different, arbitrary rule for your neighbour in the same situation."),
  A("art-15", "Article 15", "No discrimination by the State", "Right to Equality", "The State cannot discriminate against citizens only because of religion, race, caste, sex or place of birth, including access to shops, public restaurants, wells, tanks and public places. The State may make special provisions for women, children and socially and educationally backward classes.", "No one can stop you from using a public well, park or bathing ghat because of your caste."),
  A("art-16", "Article 16", "Equal opportunity in public jobs", "Right to Equality", "All citizens get equal opportunity in government employment. Reservations for backward classes and economically weaker sections are permitted as provided by the Constitution.", "Selection for a government post must follow the published rules and cannot exclude you because of religion, caste, sex, descent or place of birth."),
  A("art-17", "Article 17", "Abolition of untouchability", "Right to Equality", "Untouchability is abolished and practising it in any form is forbidden and punishable by law.", "Refusing someone entry to a temple, shop or public facility on the ground of untouchability is an offence."),
  A("art-19", "Article 19", "Six freedoms of citizens", "Right to Freedom", "Citizens have the freedom of speech and expression, to assemble peacefully without arms, to form associations or unions, to move freely and reside anywhere in India, and to practise any profession, trade or business. The State can impose reasonable restrictions on specified grounds such as public order, security of the State and decency.", "You can write a public review or join a peaceful protest, but not incite violence or defame someone."),
  A("art-20", "Article 20", "Protection in respect of conviction", "Right to Freedom", "No one can be punished under a law made after the act was done, punished twice for the same offence, or forced to be a witness against themselves.", "If you are accused of a crime, the police cannot force you to confess."),
  A("art-21", "Article 21", "Right to life and personal liberty", "Right to Freedom", "No person can be deprived of life or personal liberty except according to a procedure established by law. Courts have read this to include living with dignity, privacy, a clean environment, livelihood, health care and speedy trial.", "Your right to privacy, recognised by the Supreme Court in 2017, flows from this Article."),
  A("art-21a", "Article 21A", "Right to education", "Right to Freedom", "The State must provide free and compulsory education to all children aged 6 to 14 years, in the manner the State decides by law (the Right of Children to Free and Compulsory Education Act, 2009). Added by the 86th Amendment, 2002.", "A government school cannot charge tuition fees for a child aged 6 to 14."),
  A("art-22", "Article 22", "Protection against arbitrary arrest", "Right to Freedom", "A person who is arrested must be told the grounds of arrest, can consult and be defended by a lawyer of their choice, and must be produced before the nearest magistrate within 24 hours (excluding travel time). Different rules apply to preventive detention.", "If a relative is arrested, they must be produced before a magistrate within 24 hours of arrest."),
  A("art-23", "Article 23", "No human trafficking or forced labour", "Right against Exploitation", "Trafficking in human beings, begar (forced unpaid labour) and other forms of forced labour are prohibited and punishable.", "Bonded labour, where someone must work to repay a debt, is illegal."),
  A("art-24", "Article 24", "No child labour in hazardous work", "Right against Exploitation", "Children below 14 years cannot be employed in any factory, mine or other hazardous employment.", "A child under 14 cannot be employed in a factory or mine."),
  A("art-25", "Article 25", "Freedom of religion", "Right to Freedom of Religion", "Everyone is equally entitled to freedom of conscience and the right to freely profess, practise and propagate religion, subject to public order, morality, health and other Fundamental Rights.", "You may follow and practise your faith, or no faith, without interference from the State."),
  A("art-29", "Article 29", "Protection of language, script and culture", "Cultural and Educational Rights", "Any section of citizens with a distinct language, script or culture has the right to conserve it. No citizen can be denied admission to a State funded educational institution only on grounds of religion, race, caste or language.", "A State aided college cannot refuse you admission because of your mother tongue."),
  A("art-30", "Article 30", "Minorities' right to run educational institutions", "Cultural and Educational Rights", "Religious and linguistic minorities have the right to establish and administer educational institutions of their choice.", "A linguistic minority community can set up and manage its own school."),
  A("art-32", "Article 32", "Right to constitutional remedies", "Right to Constitutional Remedies", "You can approach the Supreme Court directly to enforce your Fundamental Rights. The Court can issue writs such as habeas corpus, mandamus, prohibition, certiorari and quo warranto.", "If someone is illegally detained, a habeas corpus petition asks the court to have them produced and released if the detention is unlawful."),
  A("art-226", "Article 226", "High Courts' power to issue writs", "Right to Constitutional Remedies", "Every High Court can issue writs to enforce Fundamental Rights and for any other purpose, within its territory. This power is wider than Article 32.", "If a government office ignores a legal duty owed to you, you can file a writ petition in your State's High Court.", { kind: "other" }),
  A("art-300a", "Article 300A", "Right to property (legal right)", "Other important rights", "No one can be deprived of their property except by authority of law. Since the 44th Amendment, 1978, this is a constitutional and legal right, not a Fundamental Right.", "Land can be acquired by the government only under a law that permits it and follows its procedure.", { kind: "other" }),
  A("art-326", "Article 326", "Universal adult suffrage", "Other important rights", "Elections to the Lok Sabha and State Assemblies are held on the basis of adult suffrage: every citizen aged 18 or above who is not otherwise disqualified can vote.", "Once you turn 18 you can register as a voter with the Election Commission.", { kind: "other" }),
];

export const DUTIES = [
  ["a", "Abide by the Constitution and respect its ideals and institutions, the National Flag and the National Anthem."],
  ["b", "Cherish and follow the noble ideals that inspired the national struggle for freedom."],
  ["c", "Uphold and protect the sovereignty, unity and integrity of India."],
  ["d", "Defend the country and render national service when called upon."],
  ["e", "Promote harmony and the spirit of common brotherhood among all the people of India and renounce practices derogatory to the dignity of women."],
  ["f", "Value and preserve the rich heritage of our composite culture."],
  ["g", "Protect and improve the natural environment, including forests, lakes, rivers and wildlife, and have compassion for living creatures."],
  ["h", "Develop the scientific temper, humanism and the spirit of inquiry and reform."],
  ["i", "Safeguard public property and abjure violence."],
  ["j", "Strive towards excellence in all spheres of individual and collective activity."],
  ["k", "Parents or guardians to provide opportunities for education to their child between 6 and 14 years of age (added by the 86th Amendment, 2002)."],
];

export const DPSP = [
  ["Article 38", "The State shall strive to promote the welfare of the people by securing a social order based on justice, and to reduce inequalities."],
  ["Article 39", "Adequate means of livelihood for all, equal pay for equal work for men and women, and protection of children and workers."],
  ["Article 39A", "Equal justice and free legal aid, so that no one is denied justice because of economic or other disabilities."],
  ["Article 40", "Organise village panchayats as units of self government."],
  ["Article 41", "Right to work, to education and to public assistance in unemployment, old age, sickness and disablement, within economic capacity."],
  ["Article 44", "Endeavour to secure a uniform civil code for citizens throughout India."],
  ["Article 45", "Early childhood care and education for all children until they complete six years."],
  ["Article 47", "Raise the level of nutrition and the standard of living and improve public health."],
  ["Article 48A", "Protect and improve the environment and safeguard forests and wildlife."],
  ["Article 50", "Separate the judiciary from the executive in the public services of the State."],
  ["Article 51", "Promote international peace and security."],
];
export const DPSP_NOTE = "Directive Principles guide the government in making laws and policies. Unlike Fundamental Rights, they cannot be directly enforced in court (Article 37), but they are fundamental in the governance of the country.";

export const AMENDMENTS = [
  ["1st", "1951", "Added the Ninth Schedule and further grounds for reasonable restrictions on freedom of speech."],
  ["7th", "1956", "Reorganised States on a linguistic basis and introduced Union Territories."],
  ["42nd", "1976", "Added the words socialist, secular and integrity to the Preamble, and added Fundamental Duties (Part IVA)."],
  ["44th", "1978", "Removed the right to property from Fundamental Rights (now Article 300A) and added safeguards to emergency powers."],
  ["52nd", "1985", "Added the Tenth Schedule: anti defection law."],
  ["61st", "1988", "Lowered the voting age from 21 to 18 years."],
  ["73rd", "1992", "Gave constitutional status to Panchayats (Part IX, Eleventh Schedule)."],
  ["74th", "1992", "Gave constitutional status to Municipalities (Part IXA, Twelfth Schedule)."],
  ["86th", "2002", "Made elementary education a Fundamental Right (Article 21A) and added duty 51A(k)."],
  ["97th", "2011", "Added provisions on co-operative societies (Part IXB)."],
  ["101st", "2016", "Introduced the Goods and Services Tax (GST)."],
  ["103rd", "2019", "Permitted up to 10% reservation for economically weaker sections."],
  ["106th", "2023", "Reserved one third of seats for women in the Lok Sabha and State Legislative Assemblies, to take effect after the next delimitation."],
];
