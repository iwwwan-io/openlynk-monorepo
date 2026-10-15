"use server";

import { isSessionAuthorized } from "@/lib/auth-validation";
import {
  validateDeliveryUrl,
  validateProductDescription,
  validateProductPrice,
  validateProductTitle,
} from "@/lib/product-validation";
import { auth } from "@openlynk/auth";
import { and, asc, eq, getDb, order, product, profile } from "@openlynk/db";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface ProductActionState {
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

function handleActionError(err: unknown, defaultMessage: string): ProductActionState {
  if (err instanceof Error && err.message === "UNAUTHORIZED") {
    redirect("/login");
  }
  if (err instanceof Error && err.message === "PROFILE_NOT_FOUND") {
    redirect("/dashboard");
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

function parsePriceFromInput(rawPrice: unknown): unknown {
  if (typeof rawPrice === "string") {
    const trimmed = rawPrice.trim();
    if (/^-?\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
    if (/^-?\d+\.\d+$/.test(trimmed)) {
      return Number(trimmed);
    }
    return trimmed;
  }
  return rawPrice;
}

/**
 * Menambahkan produk digital baru milik kreator.
 */
export async function createProductAction(
  prevState: ProductActionState | FormData,
  formData?: FormData
): Promise<ProductActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const rawTitle = data.get("title");
    const rawDescription = data.get("description");
    const rawPrice = data.get("price_idr");
    const rawDeliveryUrl = data.get("delivery_url");

    const titleVal = validateProductTitle(rawTitle);
    if (!titleVal.valid || !titleVal.normalized) {
      return { success: false, error: titleVal.error };
    }

    const descVal = validateProductDescription(rawDescription);
    if (!descVal.valid) {
      return { success: false, error: descVal.error };
    }

    const priceNum = parsePriceFromInput(rawPrice);
    const priceVal = validateProductPrice(priceNum);
    if (!priceVal.valid || priceVal.normalized === undefined) {
      return { success: false, error: priceVal.error };
    }

    const deliveryUrlVal = validateDeliveryUrl(rawDeliveryUrl);
    if (!deliveryUrlVal.valid || !deliveryUrlVal.normalized) {
      return { success: false, error: deliveryUrlVal.error };
    }

    const db = getDb();

    // Hitung posisi produk berikutnya
    const existingProducts = await db
      .select({ position: product.position })
      .from(product)
      .where(eq(product.profileId, userProfile.id))
      .orderBy(asc(product.position));

    const nextPosition =
      existingProducts.length > 0 ? Math.max(...existingProducts.map((p) => p.position)) + 1 : 0;

    await db.insert(product).values({
      profileId: userProfile.id,
      title: titleVal.normalized,
      description: descVal.normalized,
      priceIdr: priceVal.normalized,
      deliveryUrl: deliveryUrlVal.normalized,
      position: nextPosition,
      isActive: true,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat menambahkan produk digital");
  }
}

/**
 * Memperbarui data produk digital milik kreator.
 */
export async function updateProductAction(
  prevState: ProductActionState | FormData,
  formData?: FormData
): Promise<ProductActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const productId = data.get("id");
    if (typeof productId !== "string" || !productId) {
      return { success: false, error: "ID produk tidak valid" };
    }

    const rawTitle = data.get("title");
    const rawDescription = data.get("description");
    const rawPrice = data.get("price_idr");
    const rawDeliveryUrl = data.get("delivery_url");

    const titleVal = validateProductTitle(rawTitle);
    if (!titleVal.valid || !titleVal.normalized) {
      return { success: false, error: titleVal.error };
    }

    const descVal = validateProductDescription(rawDescription);
    if (!descVal.valid) {
      return { success: false, error: descVal.error };
    }

    const priceNum = parsePriceFromInput(rawPrice);
    const priceVal = validateProductPrice(priceNum);
    if (!priceVal.valid || priceVal.normalized === undefined) {
      return { success: false, error: priceVal.error };
    }

    const deliveryUrlVal = validateDeliveryUrl(rawDeliveryUrl);
    if (!deliveryUrlVal.valid || !deliveryUrlVal.normalized) {
      return { success: false, error: deliveryUrlVal.error };
    }

    const db = getDb();

    // Verifikasi kepemilikan produk
    const [existingProduct] = await db
      .select({ id: product.id })
      .from(product)
      .where(and(eq(product.id, productId), eq(product.profileId, userProfile.id)))
      .limit(1);

    if (!existingProduct) {
      return {
        success: false,
        error: "Produk tidak ditemukan atau Anda tidak memiliki akses",
      };
    }

    await db
      .update(product)
      .set({
        title: titleVal.normalized,
        description: descVal.normalized,
        priceIdr: priceVal.normalized,
        deliveryUrl: deliveryUrlVal.normalized,
        updatedAt: new Date(),
      })
      .where(eq(product.id, productId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat memperbarui produk digital");
  }
}

/**
 * Menghapus produk digital milik kreator.
 */
export async function deleteProductAction(
  prevState: ProductActionState | FormData,
  formData?: FormData
): Promise<ProductActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const productId = data.get("id");
    if (typeof productId !== "string" || !productId) {
      return { success: false, error: "ID produk tidak valid" };
    }

    const db = getDb();

    // Verifikasi kepemilikan produk
    const [existingProduct] = await db
      .select({ id: product.id })
      .from(product)
      .where(and(eq(product.id, productId), eq(product.profileId, userProfile.id)))
      .limit(1);

    if (!existingProduct) {
      return {
        success: false,
        error: "Produk tidak ditemukan atau Anda tidak memiliki akses",
      };
    }

    // Cek apakah produk sudah memiliki pesanan (order)
    const [existingOrder] = await db
      .select({ id: order.id })
      .from(order)
      .where(eq(order.productId, productId))
      .limit(1);

    if (existingOrder) {
      return {
        success: false,
        error: "Produk sudah punya pesanan, nonaktifkan saja",
      };
    }

    await db.delete(product).where(eq(product.id, productId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      (("code" in err && err.code === "23503") ||
        ("constraint_name" in err && String(err.constraint_name).includes("order_product_id")) ||
        ("message" in err && String(err.message).includes("violates foreign key constraint")))
    ) {
      return {
        success: false,
        error: "Produk sudah punya pesanan, nonaktifkan saja",
      };
    }
    return handleActionError(err, "Terjadi kesalahan saat menghapus produk digital");
  }
}


/**
 * Toggle status aktif/nonaktif produk digital.
 */
export async function toggleProductActiveAction(
  prevState: ProductActionState | FormData,
  formData?: FormData
): Promise<ProductActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const productId = data.get("id");
    if (typeof productId !== "string" || !productId) {
      return { success: false, error: "ID produk tidak valid" };
    }

    const db = getDb();

    // Verifikasi kepemilikan produk
    const [existingProduct] = await db
      .select({ id: product.id, isActive: product.isActive })
      .from(product)
      .where(and(eq(product.id, productId), eq(product.profileId, userProfile.id)))
      .limit(1);

    if (!existingProduct) {
      return {
        success: false,
        error: "Produk tidak ditemukan atau Anda tidak memiliki akses",
      };
    }

    await db
      .update(product)
      .set({
        isActive: !existingProduct.isActive,
        updatedAt: new Date(),
      })
      .where(eq(product.id, productId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat mengubah status produk");
  }
}

/**
 * Mengubah posisi urutan produk (naik / turun).
 */
export async function reorderProductAction(
  prevState: ProductActionState | FormData,
  formData?: FormData
): Promise<ProductActionState> {
  try {
    const { userProfile } = await getSessionUserProfile();
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const productId = data.get("id");
    const direction = data.get("direction");

    if (typeof productId !== "string" || !productId) {
      return { success: false, error: "ID produk tidak valid" };
    }

    if (direction !== "up" && direction !== "down") {
      return { success: false, error: "Arah perpindahan harus 'up' atau 'down'" };
    }

    const db = getDb();

    // Ambil seluruh produk milik profil terurut berdasarkan posisi
    const userProducts = await db
      .select()
      .from(product)
      .where(eq(product.profileId, userProfile.id))
      .orderBy(asc(product.position), asc(product.createdAt));

    const currentIndex = userProducts.findIndex((p) => p.id === productId);

    if (currentIndex === -1) {
      return {
        success: false,
        error: "Produk tidak ditemukan atau Anda tidak memiliki akses",
      };
    }

    const targetProduct = userProducts[currentIndex];
    if (!targetProduct) {
      return { success: false, error: "Produk tidak ditemukan" };
    }

    if (direction === "up") {
      if (currentIndex === 0) {
        return { success: true };
      }

      const prevProduct = userProducts[currentIndex - 1];
      if (!prevProduct) {
        return { success: true };
      }

      const targetPos = prevProduct.position;
      const prevPos =
        prevProduct.position === targetProduct.position
          ? targetProduct.position + 1
          : targetProduct.position;

      await db
        .update(product)
        .set({ position: targetPos, updatedAt: new Date() })
        .where(eq(product.id, targetProduct.id));

      await db
        .update(product)
        .set({ position: prevPos, updatedAt: new Date() })
        .where(eq(product.id, prevProduct.id));
    } else if (direction === "down") {
      if (currentIndex === userProducts.length - 1) {
        return { success: true };
      }

      const nextProduct = userProducts[currentIndex + 1];
      if (!nextProduct) {
        return { success: true };
      }

      const targetPos = nextProduct.position;
      const nextPos =
        nextProduct.position === targetProduct.position
          ? targetProduct.position - 1
          : targetProduct.position;

      await db
        .update(product)
        .set({ position: targetPos, updatedAt: new Date() })
        .where(eq(product.id, targetProduct.id));

      await db
        .update(product)
        .set({ position: nextPos, updatedAt: new Date() })
        .where(eq(product.id, nextProduct.id));
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/products");
    revalidatePath(`/${userProfile.username}`);
    return { success: true };
  } catch (err: unknown) {
    return handleActionError(err, "Terjadi kesalahan saat memindahkan produk");
  }
}
