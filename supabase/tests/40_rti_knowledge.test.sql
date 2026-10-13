\set ON_ERROR_STOP 0
grant all on public.rti_requests to authenticated;
set role authenticated;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
insert into rti_requests (title, authority, filed_on) values ('Road repair work order', 'BBMP', '2026-01-01');
select 'R1 save own RTI' t, count(*)=1 ok from rti_requests;
insert into rti_requests (title, filed_on, reply_on) values ('Bad dates', '2026-02-01', '2026-01-01');
select 'R2 reply before filing rejected' t, count(*)=1 ok from rti_requests;
insert into rti_requests (user_id, title) values ('00000000-0000-0000-0000-0000000000e1', 'As someone else');
select 'R3 cannot create for another user' t, count(*)=1 ok from rti_requests;
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000c';
select 'R4 super admin cannot read citizen RTI' t, count(*)=0 ok from rti_requests;
update rti_requests set title='x'; 
set request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
select 'R5 untouched by others' t, title='Road repair work order' ok from rti_requests;
set request.jwt.claim.sub = '00000000-0000-0000-0000-0000000000c1';
select 'R6 knowledge collection allowed' t, imported=1 ok from public.cms_import('app:knowledge', '[{"collection":"knowledge","key":"art-21","data":{"title":"Right to life","summary":"x"}}]');
