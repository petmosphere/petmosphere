grant delete on table public.pets to authenticated;

create policy "pets_delete_own"
on public.pets
for delete
to authenticated
using ((select auth.uid()) = owner_id);
