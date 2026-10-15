import { fetchMidtransOrderStatus } from "@/lib/midtrans";
import { OrderStatusRefresh } from "./order-status-refresh";
import { formatPriceIdr } from "@/lib/product-validation";
import { eq, getDb, order, product, profile } from "@openlynk/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@openlynk/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  params: Promise<{
    accessToken: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Status Pesanan | Openlynk",
    referrer: "no-referrer",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function OrderPage(props: OrderPageProps) {
  const { accessToken } = await props.params;

  if (!accessToken || typeof accessToken !== "string") {
    notFound();
  }

  const db = getDb();

  // 1. Ambil data order awal tanpa delivery_url
  const [initialOrder] = await db
    .select({
      id: order.id,
      productId: order.productId,
      productTitle: order.productTitle,
      amountIdr: order.amountIdr,
      status: order.status,
      midtransOrderId: order.midtransOrderId,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
    })
    .from(order)
    .where(eq(order.accessToken, accessToken))
    .limit(1);

  if (!initialOrder) {
    notFound();
  }

  let orderData = { ...initialOrder };

  // Sinkronisasi status langsung dari Midtrans API jika status saat ini masih 'pending'
  if (orderData.status === "pending" && orderData.midtransOrderId) {
    const remote = await fetchMidtransOrderStatus(orderData.midtransOrderId);
    if (remote && remote.status && remote.status !== "pending") {
      const isValidAmount =
        remote.grossAmount === null || remote.grossAmount === orderData.amountIdr;
      if (isValidAmount) {
        const newStatus = remote.status;
        const newPaidAt = newStatus === "paid" ? new Date() : null;
        await db
          .update(order)
          .set({
            status: newStatus,
            paidAt: newPaidAt,
            updatedAt: new Date(),
          })
          .where(eq(order.id, orderData.id));

        orderData.status = newStatus;
        orderData.paidAt = newPaidAt;
      }
    }
  }

  // 2. Ambil profil kreator produk untuk tautan kembali
  const [creatorInfo] = await db
    .select({
      username: profile.username,
      displayName: profile.displayName,
    })
    .from(product)
    .innerJoin(profile, eq(product.profileId, profile.id))
    .where(eq(product.id, orderData.productId))
    .limit(1);

  const creatorUsername = creatorInfo?.username || "";
  const creatorName = creatorInfo?.displayName || "Kreator";

  // 3. KEAMANAN: delivery_url HANYA di-query jika status pesanan adalah 'paid'
  let deliveryUrl: string | null = null;
  if (orderData.status === "paid") {
    const [secretProduct] = await db
      .select({ deliveryUrl: product.deliveryUrl })
      .from(product)
      .where(eq(product.id, orderData.productId))
      .limit(1);
    deliveryUrl = secretProduct?.deliveryUrl || null;
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="text-center">
          <Link href="/" className="text-sm font-bold tracking-tight text-slate-800">
            Openlynk
          </Link>
        </header>

        {/* STATUS: PENDING */}
        {orderData.status === "pending" && (
          <Card className="bg-white shadow-sm border-amber-200">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xl">
                ⏳
              </div>
              <Badge
                variant="outline"
                className="mx-auto bg-amber-50 text-amber-800 border-amber-300"
              >
                Menunggu Pembayaran
              </Badge>
              <CardTitle className="text-xl font-bold text-slate-900 mt-2">
                Menunggu Pembayaran
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Silakan selesaikan pembayaran Anda di jendela Midtrans. Status akan otomatis
                diperbarui setelah pembayaran diterima.
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Produk:</span>
                  <span className="font-semibold text-slate-900">{orderData.productTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Tagihan:</span>
                  <span className="font-bold text-blue-600">
                    {formatPriceIdr(orderData.amountIdr)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Email Pembeli:</span>
                  <span className="text-slate-700">{orderData.buyerEmail}</span>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50/80 p-3 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                💡 <strong>Catatan:</strong> Jika Anda membatalkan pembayaran di jendela Midtrans
                (misalnya batal scan QRIS), pesanan ini akan otomatis kedaluwarsa setelah batas
                waktu habis. Anda dapat melakukan pembelian ulang kapan saja.
              </div>

              <OrderStatusRefresh />

              <div className="pt-2 text-center space-y-2">
                <Link href={`/checkout/${orderData.productId}`}>
                  <Button variant="outline" className="w-full text-slate-700 border-slate-300">
                    🔄 Beli Ulang / Coba Metode Lain
                  </Button>
                </Link>
                {creatorUsername && (
                  <Link href={`/${creatorUsername}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-slate-500 hover:text-slate-800"
                    >
                      ← Kembali ke Profil {creatorName}
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* STATUS: PAID */}
        {orderData.status === "paid" && (
          <Card className="bg-white shadow-sm border-green-200">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 text-xl font-bold">
                ✓
              </div>
              <Badge
                variant="outline"
                className="mx-auto bg-green-50 text-green-800 border-green-300"
              >
                Pembayaran Berhasil
              </Badge>
              <CardTitle className="text-2xl font-bold text-slate-900 mt-2">
                Terima Kasih, {orderData.buyerName}!
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Pembayaran Anda sebesar {formatPriceIdr(orderData.amountIdr)} telah diverifikasi.
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              {/* Peringatan penting sesuai instruksi */}
              <div
                role="alert"
                className="rounded-lg bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium"
              >
                ⚠️ <strong>Perhatian:</strong> Simpan link halaman ini. Kami belum mengirim email.
              </div>

              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Produk Digital:</span>
                  <span className="font-semibold text-slate-900">{orderData.productTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status Transaksi:</span>
                  <span className="font-semibold text-green-700">Lunas (Paid)</span>
                </div>
              </div>

              {deliveryUrl ? (
                <div className="pt-2">
                  <a
                    href={deliveryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full"
                  >
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-sm shadow-md transition">
                      Akses Produk Digital Anda ↗
                    </Button>
                  </a>
                  <p className="mt-2 text-center text-[11px] text-slate-400">
                    Klik tombol di atas untuk membuka link pengiriman/unduhan produk Anda.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-center text-red-600">
                  Tautan pengiriman produk sedang dipersiapkan oleh sistem.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* STATUS: EXPIRED ATAU FAILED */}
        {(orderData.status === "expired" || orderData.status === "failed") && (
          <Card className="bg-white shadow-sm border-red-200">
            <CardHeader className="text-center pb-3">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-700 text-xl font-bold">
                ✕
              </div>
              <Badge variant="outline" className="mx-auto bg-red-50 text-red-800 border-red-300">
                {orderData.status === "expired" ? "Waktu Pembayaran Habis" : "Pembayaran Gagal"}
              </Badge>
              <CardTitle className="text-xl font-bold text-slate-900 mt-2">
                {orderData.status === "expired"
                  ? "Batas Waktu Pembayaran Telah Habis"
                  : "Transaksi Pembayaran Tidak Berhasil"}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                {orderData.status === "expired"
                  ? "Pesanan ini telah kedaluwarsa karena tidak dibayarkan dalam batas waktu yang ditentukan."
                  : "Pembayaran telah dibatalkan atau ditolak oleh penyedia pembayaran."}
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Produk:</span>
                  <span className="font-semibold text-slate-900">{orderData.productTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal:</span>
                  <span className="font-semibold text-slate-700">
                    {formatPriceIdr(orderData.amountIdr)}
                  </span>
                </div>
              </div>

              {creatorUsername && (
                <div className="pt-2 text-center">
                  <Link href={`/${creatorUsername}`}>
                    <Button variant="outline" className="w-full text-slate-700">
                      ← Kembali ke Halaman Profil {creatorName}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center">
          {creatorUsername && (
            <Link
              href={`/${creatorUsername}`}
              className="text-xs text-slate-500 hover:text-slate-800 transition"
            >
              Halaman resmi {creatorName} (@{creatorUsername})
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
