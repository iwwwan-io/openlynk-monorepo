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

/**
 * Mendeteksi error pelanggaran keunikan database PostgreSQL (kode 23505)
 * untuk menangani kondisi balapan konkurensi (race condition) secara elegan.
 */
export function handleDatabaseUniqueError(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const errorObj = err as { code?: string; message?: string; constraint_name?: string };
    const code = errorObj.code;
    const msg = String(errorObj.message || "");
    const constraint = String(errorObj.constraint_name || "");

    if (
      code === "23505" ||
      msg.includes("unique constraint") ||
      msg.includes("duplicate key value")
    ) {
      if (
        constraint.includes("username") ||
        msg.includes("profile_username_unique") ||
        msg.includes("username")
      ) {
        return "Username sudah digunakan, silakan pilih username lain";
      }
      if (
        constraint.includes("user_id") ||
        msg.includes("profile_user_id_unique") ||
        msg.includes("user_id")
      ) {
        return "Anda sudah memiliki profil";
      }
      return "Data yang dimasukkan sudah terdaftar";
    }
  }
  return null;
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
 * Onboarding/Pembuatan profil awal kreator dengan proteksi race condition.
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
    const rawAvatarUrl = data.get("avatarUrl");

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

    const avatarVal = validateAvatarUrl(rawAvatarUrl);
    if (!avatarVal.valid) {
      return { success: false, error: avatarVal.error };
    }

    const db = getDb();

    // Pengecekan awal profil akun
    const existing = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      return { success: false, error: "Profil untuk akun ini sudah ada" };
    }

    // Pengecekan awal keunikan username
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

    // Eksekusi insert dengan penangkapan Postgres unique constraint race condition
    try {
      await db.insert(profile).values({
        userId: user.id,
        username: usernameVal.normalized,
        displayName: displayNameVal.normalized,
        bio: bioVal.normalized,
        avatarUrl: avatarVal.normalized,
      });
    } catch (insertErr: unknown) {
      const friendlyError = handleDatabaseUniqueError(insertErr);
      if (friendlyError) {
        return { success: false, error: friendlyError };
      }
      throw insertErr;
    }

    revalidatePath("/dashboard");
    revalidatePath(`/${usernameVal.normalized}`);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal membuat profil kreator",
    };
  }
}

/**
 * Pembaruan profil kreator (nama tampilan, bio, avatar) dengan proteksi race condition.
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

    try {
      await db
        .update(profile)
        .set({
          displayName: displayNameVal.normalized,
          bio: bioVal.normalized,
          avatarUrl: avatarVal.normalized,
          updatedAt: new Date(),
        })
        .where(eq(profile.id, userProfile.id));
    } catch (updateErr: unknown) {
      const friendlyError = handleDatabaseUniqueError(updateErr);
      if (friendlyError) {
        return { success: false, error: friendlyError };
      }
      throw updateErr;
    }

    revalidatePath("/dashboard");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "UNAUTHORIZED") {
      redirect("/login");
    }
    if (
      typeof err === "object" &&
      err !== null &&
      "digest" in err &&
      String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }
    return {
      success: false,
      error: err instanceof Error ? err.message : "Gagal memperbarui profil",
    };
  }
}
