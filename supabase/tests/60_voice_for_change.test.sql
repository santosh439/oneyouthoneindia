\set ON_ERROR_STOP 0
reset role;
grant all on public.organizations, public.org_reps, public.org_responses to authenticated;
grant select on public.organizations, public.org_responses to anon;
insert into auth.users (id,email) values ('00000000-0000-0000-0000-0000000aa001','rep@x.in'),('00000000-0000-0000-0000-0000000aa002','cit@x.in') on conflict do nothing;
insert into public.profiles (id, display_name, role) values ('00000000-0000-0000-0000-0000000aa001','Rita','citizen'),('00000000-0000-0000-0000-0000000aa002','Cyrus','citizen')
  on conflict (id) do update set role = excluded.role;
set role authenticated;
-- Citizen submits a private sector experience
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000aa002';
insert into public.organizations (name, sector, category) values ('Speedy Fibre Pvt Ltd', 'private', 'telecom');
select 'V1 suggestion is pending and unverified' t, status = 'pending' and not verified ok from public.organizations where name = 'Speedy Fibre Pvt Ltd';
insert into public.organizations (name, sector, verified, status) values ('Fake Verified Co', 'private', true, 'published');
select 'V2 citizen cannot self verify an organisation' t, count(*) = 0 ok from public.organizations where name = 'Fake Verified Co';
select public.org_import('[{"name":"Ministry of Railways","sector":"government","website":"https://indianrailways.gov.in","source_url":"https://igod.gov.in","verified":true}]');
select 'V3 citizen cannot import organisations' t, count(*) = 0 ok from public.organizations where name = 'Ministry of Railways';
-- Admin imports official organisations, twice (no duplicates)
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select public.org_import('[{"name":"Ministry of Railways","sector":"government","category":"transport","website":"https://indianrailways.gov.in","source_label":"NIC directory","source_url":"https://igod.gov.in","verified":true,"verified_at":"2026-10-13"}]');
select public.org_import('[{"name":"Ministry  of Railways","sector":"government","category":"transport","website":"https://indianrailways.gov.in","source_label":"NIC directory","source_url":"https://igod.gov.in","verified":true,"verified_at":"2026-10-13"}]');
select 'V4 import is verified, published and not duplicated' t, count(*) = 1 and bool_and(verified and status = 'published' and last_verified_at is not null) ok from public.organizations where name_key = 'ministry of railways';
update public.organizations set verified = true where name = 'Speedy Fibre Pvt Ltd';
select 'V20 verified needs a source and date' t, not verified ok from public.organizations where name = 'Speedy Fibre Pvt Ltd';
select public.admin_set_org_rep('00000000-0000-0000-0000-0000000aa001', (select id from public.organizations where name = 'Speedy Fibre Pvt Ltd'));
select 'V5 no representative for an unverified organisation' t, count(*) = 0 ok from public.org_reps;
update public.organizations set verified = true, status = 'published', last_verified_at = now(), source_url = 'https://igod.gov.in' where name = 'Speedy Fibre Pvt Ltd';
select public.admin_set_org_rep('00000000-0000-0000-0000-0000000aa001', (select id from public.organizations where name = 'Speedy Fibre Pvt Ltd'));
select 'V6 representative granted and role set' t, (select role from public.profiles where id = '00000000-0000-0000-0000-0000000aa001') = 'org_rep' ok;
-- Citizen posts about the verified org; future experience date is rejected
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000aa002';
insert into public.posts (type, cat, entity, city, state, title, body, rating, sector, organization_id, experience_date) values ('review','telecom','Speedy Fibre','Pune','Maharashtra','Fibre down for a week','The connection was down for seven days and support did not call back.',2,'private',(select id from public.organizations where name='Speedy Fibre Pvt Ltd'), current_date + 30);
select 'V7 future experience date rejected' t, count(*) = 0 ok from public.posts where title = 'Fibre down for a week';
insert into public.posts (type, cat, entity, city, state, title, body, rating, sector, organization_id, experience_date, suggestion) values ('review','telecom','Speedy Fibre','Pune','Maharashtra','Fibre down for a week','The connection was down for seven days and support did not call back.',2,'private',(select id from public.organizations where name='Speedy Fibre Pvt Ltd'), current_date - 3, 'Give a ticket number and a callback time.');
select 'V8 private sector experience saved as Submitted' t, status = 'Submitted' and sector = 'private' and suggestion is not null ok from public.posts where title = 'Fibre down for a week';
-- Rep cannot respond before publication
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000aa001';
select public.org_respond((select id from public.posts where title = 'Fibre down for a week'), 'We are sorry, please share your account number privately.');
reset role; set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select 'V9 no response before publication' t, count(*) = 0 ok from public.org_responses;
select public.staff_update((select id from public.posts where title = 'Fibre down for a week'), p_publication => 'approved', p_reason => 'ok');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000aa001';
select public.org_respond((select id from public.posts where title = 'Fibre down for a week'), 'We are sorry, please share your account number privately.');
update public.posts set hidden = true, status = 'Closed' where title = 'Fibre down for a week';
select public.org_respond((select id from public.posts where title = 'Pothole near metro'), 'Not our organisation but replying anyway.');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select 'V10 rep responded once, only to own organisation' t, count(*) = 1 ok from public.org_responses;
select 'V11 rep cannot edit, hide or close the feedback' t, not hidden and status = 'Submitted' ok from public.posts where title = 'Fibre down for a week';
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000aa002';
select 'V12 author notified of the organisation response' t, count(*) = 1 ok from public.notifications where title like '%Speedy Fibre Pvt Ltd responded';
-- Further review
select public.request_further_review((select id from public.posts where title = 'Fibre down for a week'), 'Still not working after the reply.');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select 'V13 no further review before an outcome' t, status = 'Submitted' ok from public.posts where title = 'Fibre down for a week';
select public.staff_update((select id from public.posts where title = 'Fibre down for a week'), p_status => 'Outcome provided', p_reason => 'Provider restored service');
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000aa002';
select public.request_further_review((select id from public.posts where title = 'Fibre down for a week'), 'Still not working after the reply.');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select 'V14 further review reopens to Under review' t, status = 'Under review' and further_reviews = 1 ok from public.posts where title = 'Fibre down for a week';
select public.staff_update((select id from public.posts where title = 'Fibre down for a week'), p_status => 'Resolved');
select 'V15 old status names are rejected' t, status = 'Under review' ok from public.posts where title = 'Fibre down for a week';
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000aa002';
insert into public.votes (post_id, kind) values ((select id from public.posts where title = 'Fibre down for a week'), 'helpful');
select 'V16 helpful vote recorded' t, count(*) = 1 ok from public.votes where kind = 'helpful';
reset role; set role anon; set request.jwt.claim.sub = '';
select 'V17 public sees only published organisations' t, count(*) = 2 ok from public.organizations;
select 'V18 public organisation stats' t, reviews = 1 and avg_rating = 2 and responses = 1 ok from public.org_stats((select id from public.organizations where name = 'Speedy Fibre Pvt Ltd'));
reset role;
update public.posts set sample = true, publication = 'approved' where title = 'Pothole near metro';
set role authenticated; set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000aa002';
select 'V19 sample rows never shown publicly' t, count(*) = 0 ok from public.posts where title = 'Pothole near metro';
