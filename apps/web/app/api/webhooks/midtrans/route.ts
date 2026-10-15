import {
  isStatusDowngradeBlocked,
  mapMidtransStatus,
  parseMidtransAmount,
  verifyMidtransSignature,
} from "@/lib/midtrans";
import { eq, getDb, order, type OrderStatus } from "@openlynk/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Format payload JSON tidak valid" }, { status: 400 });
  }

  const orderId = typeof body.order_id === "string" ? body.order_id.trim() : "";
  const statusCode = typeof body.status_code === "string" ? body.status_code.trim() : "";
  const grossAmountRaw = body.gross_amount;
  const signatureKey = typeof body.signature_key === "string" ? body.signature_key.trim() : "";
  const transactionStatus =
    typeof body.transaction_status === "string" ? body.transaction_status.trim() : "";
  const fraudStatus = typeof body.fraud_status === "string" ? body.fraud_status.trim() : null;

  const serverKey = process.env.MIDTRANS_SERVER_KEY || "";

  // 1. Verifikasi signature_key Midtrans dengan perbandingan timing-safe
  const isSignatureValid = verifyMidtransSignature({
    orderId,
    statusCode,
    grossAmount:
      typeof grossAmountRaw === "string" || typeof grossAmountRaw === "number"
        ? grossAmountRaw
        : "",
    serverKey,
    signatureKey,
  });

  if (!isSignatureValid) {
    return NextResponse.json({ error: "Forbidden: Signature key tidak valid" }, { status: 403 });
  }

  // 2. Cari order di database berdasarkan midtrans_order_id
  const db = getDb();
  const [existingOrder] = await db
    .select()
    .from(order)
    .where(eq(order.midtransOrderId, orderId))
    .limit(1);

  if (!existingOrder) {
    return NextResponse.json({ error: "Not Found: Pesanan tidak ditemukan" }, { status: 404 });
  }

  // 3. Cocokkan gross_amount dengan amount_idr order (bandingkan sebagai angka)
  const parsedAmount = parseMidtransAmount(grossAmountRaw);
  if (parsedAmount === null || parsedAmount !== existingOrder.amountIdr) {
    console.error(
      `[Midtrans Webhook Error] Ketidakcocokan nominal gross_amount untuk order ${orderId}: diharapkan ${existingOrder.amountIdr}, diterima ${parsedAmount}`
    );
    return NextResponse.json(
      { error: "Unprocessable Entity: Nominal transaksi tidak cocok" },
      { status: 422 }
    );
  }

  // 4. Pemetaan transaction_status ke OrderStatus
  const newStatus = mapMidtransStatus(transactionStatus, fraudStatus);
  if (!newStatus) {
    return NextResponse.json(
      { status: "ignored", message: `Status transaksi '${transactionStatus}' diabaikan` },
      { status: 200 }
    );
  }

  // 5. Idempotensi: webhook ganda aman, status paid TIDAK BOLEH turun ke status lain
  if (isStatusDowngradeBlocked(existingOrder.status as OrderStatus, newStatus)) {
    return NextResponse.json(
      { status: "ok", message: "Pesanan sudah berstatus paid; penurunan status diabaikan" },
      { status: 200 }
    );
  }

  // Jika status sama persis, tidak perlu update DB (idempotent)
  if (existingOrder.status === newStatus) {
    return NextResponse.json(
      { status: "ok", message: "Status pesanan tidak berubah" },
      { status: 200 }
    );
  }

  // 6. Update status order dan isi paid_at jika status menjadi paid
  const updatePayload: {
    status: OrderStatus;
    paidAt?: Date;
    updatedAt: Date;
  } = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === "paid") {
    updatePayload.paidAt = new Date();
  }

  await db.update(order).set(updatePayload).where(eq(order.id, existingOrder.id));

  return NextResponse.json(
    { status: "ok", message: `Status pesanan berhasil diperbarui ke ${newStatus}` },
    { status: 200 }
  );
}
