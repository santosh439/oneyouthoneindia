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
