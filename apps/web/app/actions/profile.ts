"use server";

import { isSessionAuthorized } from "@/lib/auth-validation";
import {
  validateAvatarUrl,
  validateBio,
  validateDisplayName,
  validateUsername,
} from "@/lib/profile-validation";
import { auth } from "@openlynk/auth";
import { eq, getDb, profile } from "@openlynk/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface ProfileActionState {
  success?: boolean;
  error?: string;
}

async function getSessionUser() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!isSessionAuthorized(session) || !session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  return session.user;
}

/**
 * Onboarding/Pembuatan profil awal kreator.
 */
export async function createProfileAction(
  prevState: ProfileActionState | FormData,
  formData?: FormData
): Promise<ProfileActionState> {
  try {
    const user = await getSessionUser();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const rawUsername = data.get("username");
    const rawDisplayName = data.get("displayName");
    const rawBio = data.get("bio");

    const usernameVal = validateUsername(rawUsername);
    if (!usernameVal.valid || !usernameVal.normalized) {
      return { success: false, error: usernameVal.error };
    }

    const displayNameVal = validateDisplayName(rawDisplayName);
    if (!displayNameVal.valid || !displayNameVal.normalized) {
      return { success: false, error: displayNameVal.error };
    }

    const bioVal = validateBio(rawBio);
    if (!bioVal.valid) {
      return { success: false, error: bioVal.error };
    }

    const db = getDb();

    // Pastikan pengguna belum memiliki profil
    const existing = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Profil untuk akun ini sudah ada" };
    }

    // Pastikan username belum dipakai oleh pengguna lain
    const usernameConflict = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.username, usernameVal.normalized))
      .limit(1);

    if (usernameConflict.length > 0) {
      return {
        success: false,
        error: "Username sudah digunakan, silakan pilih username lain",
      };
    }

    await db.insert(profile).values({
      userId: user.id,
      username: usernameVal.normalized,
      displayName: displayNameVal.normalized,
      bio: bioVal.normalized,
    });

    revalidatePath("/dashboard");
    revalidatePath(`/${usernameVal.normalized}`);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membuat profil kreator",
    };
  }
}

/**
 * Pembaruan profil kreator (nama tampilan, bio, avatar).
 */
export async function updateProfileAction(
  prevState: ProfileActionState | FormData,
  formData?: FormData
): Promise<ProfileActionState> {
  try {
    const user = await getSessionUser();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const rawDisplayName = data.get("displayName");
    const rawBio = data.get("bio");
    const rawAvatarUrl = data.get("avatarUrl");

    const displayNameVal = validateDisplayName(rawDisplayName);
    if (!displayNameVal.valid || !displayNameVal.normalized) {
      return { success: false, error: displayNameVal.error };
    }

    const bioVal = validateBio(rawBio);
    if (!bioVal.valid) {
      return { success: false, error: bioVal.error };
    }

    const avatarVal = validateAvatarUrl(rawAvatarUrl);
    if (!avatarVal.valid) {
      return { success: false, error: avatarVal.error };
    }

    const db = getDb();

    const [userProfile] = await db
      .select()
      .from(profile)
      .where(eq(profile.userId, user.id))
      .limit(1);

    if (!userProfile) {
      return { success: false, error: "Profil belum dibuat" };
    }

    await db
      .update(profile)
      .set({
        displayName: displayNameVal.normalized,
        bio: bioVal.normalized,
        avatarUrl: avatarVal.normalized,
        updatedAt: new Date(),
      })
      .where(eq(profile.id, userProfile.id));

    revalidatePath("/dashboard");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui profil",
    };
  }
}
