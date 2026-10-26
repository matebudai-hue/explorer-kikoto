-- Follow-up to the initial deployed schema. Keeps the private admin table closed.
begin;
create index explorer_activity_user on public.explorer_activity(user_id);
create policy admins_no_direct_access on explorer_private.admins for select to anon,authenticated using(false);
alter policy profile_read on public.explorer_profiles using (id=(select auth.uid()) or (select public.explorer_is_admin()));
alter policy membership_read on public.explorer_memberships using (user_id=(select auth.uid()) or (select public.explorer_is_admin()));
alter policy state_read on public.explorer_learning_states using ((select public.explorer_is_admin()) or (user_id=(select auth.uid()) and public.explorer_is_member(cohort_id)));
alter policy activity_read on public.explorer_activity using ((select public.explorer_is_admin()) or (user_id=(select auth.uid()) and public.explorer_is_member(cohort_id)));
alter policy cohort_read on public.explorer_cohorts using ((select public.explorer_is_admin()) or public.explorer_is_member(id));
commit;
