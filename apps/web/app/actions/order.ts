"use server";

import { getMidtransConfig, validateBuyerEmail, validateBuyerName } from "@/lib/midtrans";
import { eq, getDb, order, product } from "@openlynk/db";
import crypto from "node:crypto";

export interface CreateOrderResult {
  success: boolean;
  error?: string;
  snapToken?: string;
  accessToken?: string;
}

/**
 * Server Action: Membuat pesanan baru dan memanggil Midtrans Snap API.
 * KEAMANAN: Judul dan harga DIAMBIL LANGSUNG DARI DATABASE, tidak pernah dari input browser.
 */
export async function createOrderAction(
  prevState: CreateOrderResult | FormData,
  formData?: FormData
): Promise<CreateOrderResult> {
  try {
    const data = formData instanceof FormData ? formData : (prevState as FormData);

    const productId = data.get("product_id");
    const rawName = data.get("buyer_name");
    const rawEmail = data.get("buyer_email");

    if (typeof productId !== "string" || !productId.trim()) {
      return { success: false, error: "ID produk tidak valid" };
    }

    // 1. Validasi nama dan email pembeli di server
    const nameVal = validateBuyerName(rawName);
    if (!nameVal.valid || !nameVal.normalized) {
      return { success: false, error: nameVal.error };
    }

    const emailVal = validateBuyerEmail(rawEmail);
    if (!emailVal.valid || !emailVal.normalized) {
      return { success: false, error: emailVal.error };
    }

    const db = getDb();

    // 2. Ambil judul dan harga ASLI langsung dari database (TOLAK manipulasi browser)
    const [targetProduct] = await db
      .select({
        id: product.id,
        title: product.title,
        priceIdr: product.priceIdr,
        isActive: product.isActive,
      })
      .from(product)
      .where(eq(product.id, productId.trim()))
      .limit(1);

    if (!targetProduct || !targetProduct.isActive) {
      return { success: false, error: "Produk tidak tersedia untuk dibeli saat ini" };
    }

    // 3. Buat identifier order unik dan token akses rahasia
    // midtrans_order_id: maks 50 karakter (format: ord-<uuid-prefix>-<timestamp-hex>)
    const midtransOrderId = `ord-${crypto.randomUUID().slice(0, 18)}-${Date.now().toString(36)}`;
    // access_token: 32 bytes acak base64url
    const accessToken = crypto.randomBytes(32).toString("base64url");

    // 4. Catat order awal berstatus 'pending' ke database
    const [createdOrder] = await db
      .insert(order)
      .values({
        productId: targetProduct.id,
        buyerName: nameVal.normalized,
        buyerEmail: emailVal.normalized,
        productTitle: targetProduct.title, // Snapshot judul resmi dari DB
        amountIdr: targetProduct.priceIdr, // Snapshot harga resmi dari DB
        status: "pending",
        midtransOrderId,
        accessToken,
      })
      .returning();

    if (!createdOrder) {
      return { success: false, error: "Gagal membuat data pesanan" };
    }

    // 5. Panggil Midtrans Snap API
    const { serverKey, apiBaseUrl } = getMidtransConfig();

    if (!serverKey) {
      console.error("[Midtrans Config Error] MIDTRANS_SERVER_KEY belum dikonfigurasi.");
      await db
        .update(order)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(order.id, createdOrder.id));
      return {
        success: false,
        error: "Sistem pembayaran belum siap. Silakan hubungi pengelola.",
      };
    }

    const snapEndpoint = `${apiBaseUrl}/snap/v1/transactions`;
    const authHeader = "Basic " + Buffer.from(`${serverKey}:`).toString("base64");

    const snapPayload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: targetProduct.priceIdr,
      },
      customer_details: {
        first_name: nameVal.normalized,
        email: emailVal.normalized,
      },
      item_details: [
        {
          id: targetProduct.id,
          price: targetProduct.priceIdr,
          quantity: 1,
          name: targetProduct.title.slice(0, 50),
        },
      ],
    };

    const midtransResponse = await fetch(snapEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(snapPayload),
    });

    if (!midtransResponse.ok) {
      const errText = await midtransResponse.text();
      console.error(
        `[Midtrans Snap Error] Gagal membuat snap token (${midtransResponse.status}): ${errText}`
      );

      // Tandai order failed jika panggilan Midtrans gagal
      await db
        .update(order)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(order.id, createdOrder.id));

      return {
        success: false,
        error: "Gagal memproses pembayaran ke Midtrans. Silakan coba beberapa saat lagi.",
      };
    }

    const snapData = (await midtransResponse.json()) as { token?: string };

    if (!snapData.token) {
      await db
        .update(order)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(order.id, createdOrder.id));

      return {
        success: false,
        error: "Gagal menerima token pembayaran dari Midtrans.",
      };
    }

    return {
      success: true,
      snapToken: snapData.token,
      accessToken,
    };
  } catch (err: unknown) {
    console.error("[createOrderAction Error]", err);
    return {
      success: false,
      error: "Terjadi kesalahan internal saat memproses pesanan.",
    };
  }
}
