import { getSafeNextPath } from "@petmosphere/services";
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch {
      // Return the same safe failure for configuration and provider errors.
    }
  }

  return NextResponse.redirect(
    new URL("/auth/sign-in?notice=expired-link", requestUrl.origin),
  );
}
