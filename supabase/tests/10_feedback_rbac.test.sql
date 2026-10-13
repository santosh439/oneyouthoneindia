\set ON_ERROR_STOP 0
grant all on all tables in schema public to authenticated; grant all on all sequences in schema public to authenticated;
insert into auth.users (id,email) values
 ('00000000-0000-0000-0000-00000000000a','alice@x.in'),('00000000-0000-0000-0000-00000000000b','bob@x.in'),
 ('00000000-0000-0000-0000-00000000000c','sam@x.in'),('00000000-0000-0000-0000-00000000000d','kate@x.in'),
 ('00000000-0000-0000-0000-00000000000e','dan@x.in'),('00000000-0000-0000-0000-00000000000f','ana@x.in');
insert into public.profiles (id, display_name, role, scope_state, scope_district) values
 ('00000000-0000-0000-0000-00000000000a','Alice','citizen',null,null),('00000000-0000-0000-0000-00000000000b','Bob','citizen',null,null),
 ('00000000-0000-0000-0000-00000000000c','Sam','super_admin',null,null),('00000000-0000-0000-0000-00000000000d','Kate','state_admin','Karnataka',null),
 ('00000000-0000-0000-0000-00000000000e','Dan','district_admin','Maharashtra','Pune'),('00000000-0000-0000-0000-00000000000f','Ana','analyst',null,null)
 on conflict (id) do update set display_name=excluded.display_name, role=excluded.role, scope_state=excluded.scope_state, scope_district=excluded.scope_district;
set role authenticated;
-- T1 alice submits, tries to self resolve and self publish
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into public.posts (type,cat,entity,city,district,state,title,body,status,publication) values ('issue','roads','MG Road','Bengaluru','Bengaluru Urban','Karnataka','Pothole near metro','Large pothole causing accidents every evening near the metro exit.','Open','approved');
select 'T1 ref+gate' t, ref_no ~ '^OYOI-\d{4}-\d{6}$' ok_ref, publication='pending' ok_pending, status='Submitted' ok_status from posts where title='Pothole near metro';
-- T2 visibility
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select 'T2 bob cannot see pending' t, count(*)=0 ok from posts where title='Pothole near metro';
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000e';
select 'T3 dan(Pune) cannot see KA' t, count(*)=0 ok from posts where title='Pothole near metro';
select public.staff_update((select id from posts where title='Pothole near metro' limit 1),'Outcome provided');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select 'T4 kate(KA) sees it' t, count(*)=1 ok from posts where title='Pothole near metro';
select public.staff_update((select id from posts where title='Pothole near metro'), p_status=>'Under review', p_publication=>'approved', p_reason=>'Verified with photos');
insert into post_events (post_id, actor, kind, reason) values ((select id from posts where title='Pothole near metro'), '00000000-0000-0000-0000-00000000000d','note','Call BBMP ward 112');
select 'T5 events logged w/ actor+reason' t, count(*)=2 ok from post_events where kind in ('status','publication') and actor='00000000-0000-0000-0000-00000000000d' and reason='Verified with photos';
update post_events set reason='tampered'; select 'T6 events not editable' t, count(*)=0 ok from post_events where reason='tampered';
delete from post_events; select 'T6b events not deletable' t, count(*)>0 ok from post_events;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select 'T7 bob sees after approval' t, count(*)=1 ok from posts where title='Pothole near metro';
select 'T8 bob sees no events' t, count(*)=0 ok from post_events;
select public.withdraw_feedback((select id from posts where title='Pothole near metro'));
update posts set status='Closed' where title='Pothole near metro'; 
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select 'T9 alice timeline excludes notes' t, count(*) filter (where kind='note')=0 and count(*)>=3 ok from post_events;
select 'T10 alice notified' t, count(*)=2 ok from notifications;
update posts set status='Outcome provided' where title='Pothole near metro';
select 'T11 alice cannot change status' t, status='Under review' ok from posts where title='Pothole near metro';
select public.admin_list_users();
select public.withdraw_feedback((select id from posts where title='Pothole near metro'), 'Fixed myself');
select 'T12 alice withdrew' t, withdrawn ok from posts where title='Pothole near metro';
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000b';
select 'T13 withdrawn hidden from public' t, count(*)=0 ok from posts where title='Pothole near metro';
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000d';
select public.admin_set_role('00000000-0000-0000-0000-00000000000b','admin');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select 'T14 super admin lists users' t, count(*)=6 ok from public.admin_list_users();
select public.admin_set_role('00000000-0000-0000-0000-00000000000b','moderator');
select 'T15 role change audited' t, count(*)=1 ok from audit_log where action='role_change';
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000f';
select 'T16 analyst reads' t, count(*)>=1 ok from posts;
select public.staff_update((select id from posts limit 1),'Closed');
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select 'T17 alice still sees own withdrawn' t, count(*)=1 ok from posts where title='Pothole near metro';
