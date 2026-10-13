-- Not a test file: records that already exist on a live site, inserted between the two migration passes
-- so that re-running every migration is checked against real data. Removed again before the tests run.
insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000e0e0', 'existing@user.in') on conflict do nothing;
insert into public.profiles (id, display_name) values ('00000000-0000-0000-0000-00000000e0e0', 'Existing') on conflict do nothing;
alter table public.posts disable trigger posts_before_insert;
insert into public.posts (author_id, type, cat, entity, city, state, title, body, status, publication)
values ('00000000-0000-0000-0000-00000000e0e0', 'issue', 'roads', 'MG Road', 'Bengaluru', 'Karnataka', '[existing] Pothole', 'An existing record created before the re-run.', 'Action in progress', 'approved'),
       ('00000000-0000-0000-0000-00000000e0e0', 'review', 'telecom', 'Some ISP', 'Pune', 'Maharashtra', '[existing] Slow fibre', 'An existing private sector record before re-run.', 'Outcome provided', 'approved');
alter table public.posts enable trigger posts_before_insert;
