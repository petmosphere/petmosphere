import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export async function requireUser(nextPath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    redirect(`/auth/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  return { supabase, user: data.user };
}
