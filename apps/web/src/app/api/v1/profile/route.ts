import * as Sentry from "@sentry/nextjs";
import { updateProfileSchema } from "@petmosphere/api-contracts";
import { updateProfile } from "@petmosphere/services";
import { NextResponse } from "next/server";

import {
  createProfilePhotoStorage,
  createProfileRepository,
  getProfileAvatarUrl,
} from "@/lib/profile/supabase-profile";
import {
  InvalidProfilePhotoError,
  prepareProfilePhoto,
} from "@/lib/profile/photo";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return NextResponse.json(
      { message: "Sign in to update your profile." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const parsed = updateProfileSchema.safeParse({
      displayName: formData.get("displayName"),
    });
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0]?.message ?? "Check your name." },
        { status: 400 },
      );
    }

    const photoEntry = formData.get("photo");
    const photo =
      photoEntry instanceof File && photoEntry.size > 0
        ? await prepareProfilePhoto(photoEntry)
        : undefined;
    const profile = await updateProfile(
      data.user.id,
      parsed.data.displayName,
      photo,
      createProfileRepository(supabase),
      createProfilePhotoStorage(supabase),
    );
    if (!profile) {
      return NextResponse.json(
        { message: "Profile not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      avatarUrl: await getProfileAvatarUrl(supabase, profile.avatarPath),
      displayName: profile.displayName,
    });
  } catch (error) {
    if (error instanceof InvalidProfilePhotoError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    Sentry.captureException(error, { tags: { operation: "profile_update" } });
    return NextResponse.json(
      { message: "We could not update your profile. Try again." },
      { status: 500 },
    );
  }
}
