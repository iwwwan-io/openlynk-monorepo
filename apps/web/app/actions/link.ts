"use server";

import { isSessionAuthorized } from "@/lib/auth-validation";
import { validateLinkTitle, validateLinkUrl } from "@/lib/profile-validation";
import { auth } from "@openlynk/auth";
import { and, asc, eq, getDb, link, profile } from "@openlynk/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface LinkActionState {
  success?: boolean;
  error?: string;
}

async function getSessionUserProfile() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!isSessionAuthorized(session) || !session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  const db = getDb();
  const [userProfile] = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  if (!userProfile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  return { user: session.user, userProfile };
}

function handleActionError(err: unknown, defaultMessage: string): LinkActionState {
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
    error: err instanceof Error ? err.message : defaultMessage,
  };
}

/**
 * Menambahkan tautan baru ke profil kreator.
 */
export async function createLinkAction(
  prevState: LinkActionState | FormData,
  formData?: FormData
): Promise<LinkActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const rawTitle = data.get("title");
    const rawUrl = data.get("url");

    const titleVal = validateLinkTitle(rawTitle);
    if (!titleVal.valid || !titleVal.normalized) {
      return { success: false, error: titleVal.error };
    }

    const urlVal = validateLinkUrl(rawUrl);
    if (!urlVal.valid || !urlVal.normalized) {
      return { success: false, error: urlVal.error };
    }

    const db = getDb();

    // Hitung posisi berikutnya berdasarkan jumlah link yang ada
    const existingLinks = await db
      .select({ position: link.position })
      .from(link)
      .where(eq(link.profileId, userProfile.id))
      .orderBy(asc(link.position));

    const nextPosition =
      existingLinks.length > 0 ? Math.max(...existingLinks.map((l) => l.position)) + 1 : 0;

    await db.insert(link).values({
      profileId: userProfile.id,
      title: titleVal.normalized,
      url: urlVal.normalized,
      position: nextPosition,
      isActive: true,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat menambahkan link");
  }
}

/**
 * Memperbarui judul dan URL tautan milik kreator.
 */
export async function updateLinkAction(
  prevState: LinkActionState | FormData,
  formData?: FormData
): Promise<LinkActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const linkId = data.get("id");
    if (typeof linkId !== "string" || !linkId) {
      return { success: false, error: "ID tautan tidak valid" };
    }

    const rawTitle = data.get("title");
    const rawUrl = data.get("url");

    const titleVal = validateLinkTitle(rawTitle);
    if (!titleVal.valid || !titleVal.normalized) {
      return { success: false, error: titleVal.error };
    }

    const urlVal = validateLinkUrl(rawUrl);
    if (!urlVal.valid || !urlVal.normalized) {
      return { success: false, error: urlVal.error };
    }

    const db = getDb();

    // Pastikan link ada dan milik profile pengguna yang login
    const [existingLink] = await db
      .select()
      .from(link)
      .where(and(eq(link.id, linkId), eq(link.profileId, userProfile.id)))
      .limit(1);

    if (!existingLink) {
      return {
        success: false,
        error: "Tautan tidak ditemukan atau Anda tidak memiliki akses",
      };
    }

    await db
      .update(link)
      .set({
        title: titleVal.normalized,
        url: urlVal.normalized,
        updatedAt: new Date(),
      })
      .where(eq(link.id, linkId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat memperbarui link");
  }
}

/**
 * Menghapus tautan milik kreator.
 */
export async function deleteLinkAction(
  prevState: LinkActionState | FormData,
  formData?: FormData
): Promise<LinkActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const linkId = data.get("id");
    if (typeof linkId !== "string" || !linkId) {
      return { success: false, error: "ID tautan tidak valid" };
    }

    const db = getDb();

    // Verifikasi kepemilikan tautan
    const [existingLink] = await db
      .select({ id: link.id })
      .from(link)
      .where(and(eq(link.id, linkId), eq(link.profileId, userProfile.id)))
      .limit(1);

    if (!existingLink) {
      return {
        success: false,
        error: "Tautan tidak ditemukan atau Anda tidak memiliki akses",
      };
    }

    await db.delete(link).where(eq(link.id, linkId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat menghapus link");
  }
}

/**
 * Toggle status aktif/nonaktif tautan.
 */
export async function toggleLinkActiveAction(
  prevState: LinkActionState | FormData,
  formData?: FormData
): Promise<LinkActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const linkId = data.get("id");
    if (typeof linkId !== "string" || !linkId) {
      return { success: false, error: "ID tautan tidak valid" };
    }

    const db = getDb();

    // Verifikasi kepemilikan tautan
    const [existingLink] = await db
      .select({ id: link.id, isActive: link.isActive })
      .from(link)
      .where(and(eq(link.id, linkId), eq(link.profileId, userProfile.id)))
      .limit(1);

    if (!existingLink) {
      return {
        success: false,
        error: "Tautan tidak ditemukan atau Anda tidak memiliki akses",
      };
    }

    await db
      .update(link)
      .set({
        isActive: !existingLink.isActive,
        updatedAt: new Date(),
      })
      .where(eq(link.id, linkId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat mengubah status link");
  }
}

/**
 * Mengubah posisi urutan tautan (naik / turun).
 */
export async function reorderLinkAction(
  prevState: LinkActionState | FormData,
  formData?: FormData
): Promise<LinkActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const linkId = data.get("id");
    const direction = data.get("direction");

    if (typeof linkId !== "string" || !linkId) {
      return { success: false, error: "ID tautan tidak valid" };
    }

    if (direction !== "up" && direction !== "down") {
      return { success: false, error: "Arah perpindahan harus 'up' atau 'down'" };
    }

    const db = getDb();

    // Ambil semua link terurut berdasarkan position asc, lalu createdAt asc
    const userLinks = await db
      .select()
      .from(link)
      .where(eq(link.profileId, userProfile.id))
      .orderBy(asc(link.position), asc(link.createdAt));

    const currentIndex = userLinks.findIndex((l) => l.id === linkId);

    if (currentIndex === -1) {
      return {
        success: false,
        error: "Tautan tidak ditemukan atau Anda tidak memiliki akses",
      };
    }

    const targetLink = userLinks[currentIndex];
    if (!targetLink) {
      return { success: false, error: "Tautan tidak ditemukan" };
    }

    if (direction === "up") {
      if (currentIndex === 0) {
        // Sudah di posisi paling atas
        return { success: true };
      }

      const previousLink = userLinks[currentIndex - 1];
      if (!previousLink) {
        return { success: true };
      }

      // Tukar posisi
      const targetPos = previousLink.position;
      const prevPos =
        previousLink.position === targetLink.position
          ? targetLink.position + 1
          : targetLink.position;

      await db
        .update(link)
        .set({ position: targetPos, updatedAt: new Date() })
        .where(eq(link.id, targetLink.id));

      await db
        .update(link)
        .set({ position: prevPos, updatedAt: new Date() })
        .where(eq(link.id, previousLink.id));
    } else if (direction === "down") {
      if (currentIndex === userLinks.length - 1) {
        // Sudah di posisi paling bawah
        return { success: true };
      }

      const nextLink = userLinks[currentIndex + 1];
      if (!nextLink) {
        return { success: true };
      }

      // Tukar posisi
      const targetPos = nextLink.position;
      const nextPos =
        nextLink.position === targetLink.position ? targetLink.position - 1 : targetLink.position;

      await db
        .update(link)
        .set({ position: targetPos, updatedAt: new Date() })
        .where(eq(link.id, targetLink.id));

      await db
        .update(link)
        .set({ position: nextPos, updatedAt: new Date() })
        .where(eq(link.id, nextLink.id));
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/links");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat memindahkan link");
  }
}
