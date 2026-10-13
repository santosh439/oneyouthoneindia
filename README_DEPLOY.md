# One Youth One India: going live on www.oneyouthoneindia.com

## 1. Supabase (database, realtime and phone login), free tier to start
1. Create a project at https://supabase.com (choose the Mumbai region for Indian users).
2. SQL Editor > New query > paste `supabase/schema.sql` > Run. It also creates the private `evidence` storage bucket (20 MB per file) for photos and videos.
3. Authentication > Providers > Phone: enable it and connect an SMS provider (MSG91, Twilio or Vonage).
   Indian SMS requires DLT registration of your sender ID and OTP template with your SMS provider.
4. Project Settings > API: copy the Project URL and the anon public key.

## 1b. Sign in providers (Supabase > Authentication > Providers)
- Google (Gmail): create an OAuth client in Google Cloud Console; add the Supabase callback URL.
- Facebook: create an app at developers.facebook.com with Facebook Login. Instagram users sign in with the same Meta account; Instagram itself does not offer website sign in.
- LinkedIn: enable "LinkedIn (OIDC)" with an app from linkedin.com/developers using "Sign In with LinkedIn using OpenID Connect".
- Email: enable one time codes. This covers Yahoo Mail, Rediffmail, Outlook and any other email (Yahoo and Rediffmail do not offer website sign in buttons that Supabase supports). Set up a custom SMTP sender such as help@oneyouthoneindia.com.
- Phone: SMS OTP as above.
- Authentication > URL Configuration: set Site URL to https://www.oneyouthoneindia.com and add it to Redirect URLs.
After first sign in, people complete their profile: display name (public), full name, gender and age (private, stored in profile_details). Users under 18 are blocked.

## 2. Run locally
```
npm install
cp .env.example .env.local   # paste your URL and anon key
npm run dev
```

## 3. Deploy on Vercel (free tier to start)
1. Push this folder to a GitHub repository.
2. On https://vercel.com: Add New > Project > import the repository (framework: Vite).
3. Settings > Environment Variables: add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then redeploy.

## 4. Connect the domain at BigRock
1. Vercel > Project > Settings > Domains: add www.oneyouthoneindia.com and oneyouthoneindia.com.
2. BigRock > Manage DNS: add exactly the records Vercel shows (usually an A record for @ and a CNAME for www).
   Do not change MX or TXT records used for email.

## 5. Make yourself the first admin
Sign in once on the live site with your mobile, then run in Supabase SQL Editor:
```
update public.profiles set role = 'admin'
where id = (select id from auth.users where phone = '91XXXXXXXXXX');
```
The Moderation dashboard then appears in the header.

## 6. Contact
Support email: help@oneyouthoneindia.com (create it in Google Workspace or your mail host). Location: Bengaluru (Bangalore), Karnataka, India.

## 7. Before public launch
- Complete the bracketed details in src/legal.js and have a lawyer review the Privacy Policy, Terms and Grievance pages.
- Appoint and publish a Grievance Officer (IT Rules 2021) and set up a monitored grievance email.
- Test every helpline number in src/data.js for your launch states.
- Without Supabase settings the app runs in demo mode with no saved data.
- Evidence: test photo and video uploads, and make sure at least one moderator reviews new evidence every day.

## 8. Release 2: User dashboard and admin portal (Phase 12)
1. Supabase > SQL Editor > New query > paste `supabase/migrations/002_dashboard_admin.sql` > Run. Safe to run more than once.
   Existing posts stay public; every NEW submission waits for moderation before appearing publicly.
2. Make yourself super admin (replace the email):
   `update public.profiles set role = 'super_admin' where id = (select id from auth.users where email = 'you@example.com');`
3. Upload the changed files to GitHub (see CHANGES below); the workflow redeploys automatically.
4. Open https://www.oneyouthoneindia.com/admin (staff) and /dashboard (signed in users).

New pages
- /dashboard: My feedback with Feedback IDs, status KPIs, search and filters, case timeline, official responses, notifications, withdraw.
- /admin: Dashboard KPIs and charts, Public feedback queue (filters, CSV export, duplicates hint), case drawer (approve or reject publication,
  status with reason, assign, response, internal staff notes, history), Analytics & reports, Users & roles, Audit logs.

Roles: super_admin, admin, content_manager, state_admin (one state), district_admin (one district), moderator, analyst (read only), citizen.
Feedback workflow: Submitted > Under review > Assigned > In progress > Resolved / Rejected > Closed.

CHANGES (files to upload)
- NEW  supabase/migrations/002_dashboard_admin.sql
- NEW  src/sb.js, src/portal/api.js, src/portal/ui.jsx, src/portal/Dashboard.jsx, src/portal/Admin.jsx
- EDIT src/main.jsx, src/App.jsx, src/store.supabase.js, src/data.js, package.json, README_DEPLOY.md

## 9. Release 3: Website content (CMS) and Website Data Sync
1. Supabase > SQL Editor > New query > paste `supabase/migrations/003_cms_sync.sql` > Run (after 002). Safe to re-run.
2. Upload the changed files to GitHub (see CHANGES below); the workflow redeploys automatically.
3. Open /admin as super admin, admin or content manager. The first visit after each deployment runs Website Data Sync
   automatically: it imports helplines, official channels, categories, contact details, legal pages and page metadata as DRAFTS.
4. Review in Admin > Website content and click "Publish N drafts" per section (or publish items one by one).
   Until something is published, the site keeps showing the content built into the code.

How it works
- Source of truth for imports: the content built into the deployed code (data.js, legal.js) and the live page's title/description.
- New items arrive as drafts. If the code later changes an item an editor has already touched, the new version is STAGED
  ("Source update") for review: Accept or Keep current. Editors' text is never overwritten automatically.
- Publish now, schedule a date and time, unpublish, archive, preview, full version history with restore.
- Homepage announcement banner: Website content > Site settings > Homepage announcement banner.
- If Supabase is unreachable, the site waits at most 1.5 seconds and then shows the built in content.
- Roles: content_manager edits website content only; admin and super_admin see everything.

CHANGES (files to upload)
- NEW  supabase/migrations/003_cms_sync.sql, src/cms.js, src/portal/Content.jsx
- EDIT src/main.jsx, src/App.jsx, src/sb.js, src/portal/Admin.jsx, src/portal/api.js, vite.config.js, README_DEPLOY.md
- DEMO ONLY (safe to upload, never loaded in production): src/demo/mock.js, src/demo/DemoShell.jsx
  Build the demo preview with: VITE_DEMO=1 VITE_SUPABASE_URL=https://demo.supabase.co VITE_SUPABASE_ANON_KEY=demo npm run build:single

## 10. Release 4: About, What we do, How we help
- New tabbed section on the homepage with header links (#about, #what-we-do, #how-we-help) and footer links.
- Header: new phone menu; "Help near you" and "Official channels" moved under "More" on desktop; staff buttons are icons with tooltips.
- Text is editable in Admin > Website content > Site settings (About page, What we do page, How we help page).
  The next Website Data Sync imports them as drafts automatically; publish when ready. No SQL change needed.
- Please verify the "Independent and neutral" and "Who we are" wording before launch.

CHANGES (files to upload)
- NEW  src/pages.js, src/InfoTabs.jsx
- EDIT src/App.jsx, src/cms.js, src/portal/Content.jsx, src/demo/mock.js, README_DEPLOY.md

## 11. Release 5: All India City Survey and City Meter
1. Supabase > SQL Editor > New query > paste `supabase/migrations/004_city_survey.sql` > Run (after 002 and 003). Safe to re-run.
2. Upload the changed files to GitHub; the workflow redeploys automatically.

How it works
- Signed in users rate their city on 8 services (roads, water, electricity, cleanliness, safety, public transport, healthcare,
  education) from 1 Very poor to 5 Excellent, at least 5 of 8. One response per person per city; they can update it any time.
- City score = average rating converted to 0 to 100. Bands: 75+ Excellent, 60+ Good, 40+ Needs improvement, below 40 Needs urgent attention.
- Public results are aggregates only, from database functions city_meter() and india_meter(). Individual answers are private
  (row level security) and a city appears only after 3 or more responses.
- Homepage section #city-meter (also under "More" in the header and in the phone menu): All India meter, city meter with
  comparison to the All India average, top rated and needs attention lists, full ranking graph with a state filter.
- The meter refreshes every 60 seconds.

CHANGES (files to upload)
- NEW  supabase/migrations/004_city_survey.sql, src/survey.js, src/CityMeter.jsx
- EDIT src/App.jsx, src/demo/mock.js, README_DEPLOY.md

## 12. Release 6: Citizen Knowledge Center, RTI assistant, Government explorer, CI
1. Supabase > SQL Editor > run `supabase/migrations/005_knowledge_rti.sql` (after 002 to 004).
2. Upload all changed files to GitHub (or the whole folder). The new CI workflow runs unit tests, the build, a dependency
   audit, every migration plus 44 database security checks on a clean PostgreSQL, and secret scanning. Deployment to
   GitHub Pages only happens when all checks pass.
3. Open /admin > Website Data Sync > Sync now. 178 knowledge entries arrive as drafts under Website content > Knowledge base.
   Check each against its official source, tick Verified, add the date and publish. Until then the site shows the
   built in plain language summaries labelled "Plain language summary".

New page /knowledge (header: "Know your rights"; also "RTI assistant" under More):
- Know your rights: Fundamental Rights by group with daily life examples, Fundamental Duties, Directive Principles.
- Constitution library: official PDFs (English, Hindi, 21 regional languages, amendments) on legislative.gov.in,
  search across Parts, Schedules, amendments and articles, Preamble.
- RTI assistant: guide, time limits, fees, key sections, application drafting, private tracker with automatic deadlines.
- Government explorer: 28 States and 8 UTs, Union to village level, roles labelled elected, constitutional, statutory,
  judicial, civil servant (with service group), support staff or community worker. Official contacts link to igod.gov.in.
- Ask Your Constitution: answers only from the knowledge base, with references, jurisdiction and a legal disclaimer;
  English and common Hindi words.

Optional AI answers (not enabled by default, untested without a key):
  supabase functions deploy ask
  supabase secrets set ANTHROPIC_API_KEY=...       (optional ASK_MODEL)
  then add GitHub secret VITE_ASK_AI=1 and re-run the deploy workflow.
  The function only rephrases the retrieved official passages, cites them, rejects non government sources,
  and requires a signed in user.

Docker (optional, for hosting outside GitHub Pages): see Dockerfile and deploy/nginx.conf (health check at /healthz).

CHANGES
- NEW  supabase/migrations/005_knowledge_rti.sql, supabase/functions/ask/{index.ts,prompt.ts}, supabase/tests/*,
       src/knowledge/{constitution.js,rti.js,government.js,index.js,KnowledgePage.jsx}, tests/*.test.mjs,
       scripts/test-db.sh, .github/workflows/ci.yml, Dockerfile, .dockerignore, deploy/nginx.conf
- EDIT src/main.jsx, src/App.jsx, src/cms.js, src/portal/Content.jsx, src/demo/*, .github/workflows/deploy.yml,
       package.json, README_DEPLOY.md

## 13. Release 7: All India Survey Dashboard (/survey)
1. Supabase > SQL Editor > run `supabase/migrations/006_survey_dashboard.sql` (after 004).
2. Upload the changed files to GitHub; CI runs 13 unit tests and 48 database checks before deploying.

The page (header link "City survey", and "Open the full dashboard" on the homepage City Meter) shows: national score with
week on week change, auto generated insights, a tile map of all 36 States and UTs coloured by score, State and city drill
down compared with the national average, a services radar chart, a 12 week trend, a city by service heatmap, a full city
ranking with search, State filter and CSV export, and a methodology and privacy note. Data is aggregates only
(city_meter, state_meter, india_meter, survey_trend); a city or State appears after 3 responses.
Also fixes: three UTs spelled differently in the location data (Jammu And Kashmir, The Dadra And Nagar Haveli And Daman
And Diu, Andaman And Nicobar Islands) are now recognised as UTs in the Government explorer.

CHANGES
- NEW  supabase/migrations/006_survey_dashboard.sql, supabase/tests/50_survey_dashboard.test.sql, src/SurveyDashboard.jsx
- EDIT src/survey.js, src/CityMeter.jsx, src/main.jsx, src/App.jsx, src/knowledge/government.js,
       src/knowledge/KnowledgePage.jsx, src/demo/*, tests/knowledge.test.mjs, README_DEPLOY.md

## 14. Release 8: Constitution library links fixed
The Legislative Department's listing page (legislative.gov.in/constitution-of-india) often loads blank, so the library now
opens the official PDF files directly: English (as on 1 May 2026), Hindi and English diglot (2026), Tamil, Kannada and
English, Assamese, Bodo, Santhali and Maithili. Each link was opened and checked on 13 October 2026. Article "Official
source" links now open the English PDF. Other languages still link to the official list, labelled as possibly slow.
Re-check these links every few months: government sites sometimes move files when new editions are published.
CHANGES: src/knowledge/constitution.js, src/knowledge/government.js, src/knowledge/KnowledgePage.jsx, tests/knowledge.test.mjs

## 15. Release 9: Government website directory (/directory)
Header > More > "Government websites". 54 Union ministries with their departments, 19 citizen service portals,
17 commissions and regulators, 10 national starting points and the official portal of all 28 States and 8 UTs.
Search (press / to focus), sector filter, copy link, safety note. Green tick = address checked by hand on 13 Oct 2026.
Sources: igod.gov.in (NIC), Government of Sikkim web directory of State portals, and the organisations' own sites.

Weekly link check: .github/workflows/links.yml runs scripts/check-links.mjs every Monday (and on demand from the
Actions tab). It tests all 174 government links on the site, including the Constitution PDFs. A red run lists the broken
links; update the address in src/directory.js or src/knowledge/*.js. It never blocks deployment.
Please run it once by hand (Actions > Link check > Run workflow) after uploading, since addresses without a green tick
have not been opened yet.
CHANGES: NEW src/directory.js, src/DirectoryPage.jsx, scripts/check-links.mjs, .github/workflows/links.yml,
tests/directory.test.mjs. EDIT src/main.jsx, src/App.jsx, src/demo/DemoShell.jsx, README_DEPLOY.md

## 16. Release 10: Voice for Change (government and private sector)
1. BACK UP FIRST: Supabase > Database > Backups (or Project Settings > Database > download a backup).
2. Supabase > SQL Editor > run `supabase/migrations/007_voice_for_change.sql` (after 002 to 006). Safe to re-run.
   Every file (schema.sql and 002 to 007) can be re-run over existing data without losing records. If you ever
   re-run an OLDER file after 007, run 007 again afterwards so the newest rules and notifications are restored.
   It maps existing feedback to the new Feedback Progress stages:
   Open > Submitted, Acknowledged > Under review, In progress > Action in progress, Resolved > Outcome provided,
   Rejected > Closed. Old prototype "sample" rows are hidden from the public.
3. Upload the files to GitHub. The deploy workflow now refuses to deploy if the Supabase secrets are missing, and the
   site shows a maintenance notice instead of ever running without its database.
4. Admin portal > Organisations > "Import official government list" (129 ministries, departments, State and UT
   governments and commissions, with their official websites as the source).
5. To give a company a representative: verify and publish the company (with an official source link), have the person
   sign up, then Organisations > Edit > Authorised representatives > Link by email.

What changed
- Share Your Experience: Public Service Experience or Consumer Experience; 9 private sector categories (admins can edit
  categories in Website content); organisation search with verified ticks; unknown organisations become pending
  suggestions; date of experience, service location, suggested improvement.
- Feedback Progress: Submitted > Under review > Assigned > Response awaited > Action in progress > Outcome provided >
  Closed. Request Further Review within 30 days of an outcome, at most twice.
- Verified organisation responses (representatives cannot edit, hide or close feedback); citizen is notified.
- Helpful votes on reviews; sector filters on the public feed and admin queue.
- My Voice Dashboard with the full KPI set and an Organisation inbox for representatives.
- Wording: "complaint" kept only for legal terms and official channel names. Staff replies are labelled
  "Response from One Youth One India" so they are never mistaken for a government reply.

Tests: 18 unit, 69 database (the runner now fails if any check errors silently), full browser flow
(share > moderate > organisation response > notification > outcome > further review), 14 width checks.

CHANGES
- NEW  supabase/migrations/007_voice_for_change.sql, supabase/tests/60_voice_for_change.test.sql, src/portal/Orgs.jsx
- EDIT src/App.jsx, src/data.js, src/directory.js, src/store.supabase.js, src/main.jsx, src/portal/{Admin,Dashboard,api}.jsx/js,
       src/demo/mock.js, supabase/tests/{10,30}_*.sql, scripts/test-db.sh, .github/workflows/deploy.yml, README_DEPLOY.md
