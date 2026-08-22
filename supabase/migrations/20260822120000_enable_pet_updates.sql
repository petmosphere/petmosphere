grant update on table public.pets to authenticated;

create policy "pets_update_own"
on public.pets
for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);
