"use client";

import { createOrderAction } from "@/app/actions/order";
import { formatPriceIdr } from "@/lib/product-validation";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@openlynk/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Script from "next/script";
import React, { useState, useTransition } from "react";

interface SnapPayCallbacks {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
}

declare global {
  interface Window {
    snap?: {
      pay: (token: string, callbacks: SnapPayCallbacks) => void;
    };
  }
}

interface CheckoutFormProps {
  product: {
    id: string;
    title: string;
    description: string | null;
    priceIdr: number;
  };
  creator: {
    username: string;
    displayName: string;
  };
  clientKey: string;
  snapScriptUrl: string;
}

export function CheckoutForm({ product, creator, clientKey, snapScriptUrl }: CheckoutFormProps) {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [activeSnapToken, setActiveSnapToken] = useState<string | null>(null);
  const [activeAccessToken, setActiveAccessToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const triggerSnapPayment = (snapToken: string, accessToken: string) => {
    if (typeof window !== "undefined" && window.snap) {
      window.snap.pay(snapToken, {
        onSuccess: () => {
          router.push(`/order/${accessToken}`);
        },
        onPending: () => {
          router.push(`/order/${accessToken}`);
        },
        onError: () => {
          router.push(`/order/${accessToken}`);
        },
        onClose: () => {
          setNotice(
            "Jendela pembayaran ditutup sebelum transaksi diselesaikan. Anda dapat membuka kembali jendela pembayaran atau memeriksa status pesanan."
          );
          setActiveSnapToken(snapToken);
          setActiveAccessToken(accessToken);
        },
      });
    } else {
      router.push(`/order/${accessToken}`);
    }
  };

  const handleCheckout = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.append("product_id", product.id);
    formData.append("buyer_name", buyerName.trim());
    formData.append("buyer_email", buyerEmail.trim());

    startTransition(async () => {
      const res = await createOrderAction(formData);

      if (!res.success || !res.snapToken || !res.accessToken) {
        setError(res.error || "Gagal memproses pesanan.");
        return;
      }

      const accessToken = res.accessToken;
      const snapToken = res.snapToken;

      setActiveSnapToken(snapToken);
      setActiveAccessToken(accessToken);

      triggerSnapPayment(snapToken, accessToken);
    });
  };

  return (
    <>
      {snapScriptUrl && (
        <Script src={snapScriptUrl} data-client-key={clientKey} strategy="afterInteractive" />
      )}

      <div className="mx-auto max-w-lg space-y-6">
        {/* Ringkasan Produk */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Checkout Produk
              </span>
              <span className="text-xs text-slate-500">
                oleh{" "}
                <Link
                  href={`/${creator.username}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {creator.displayName}
                </Link>
              </span>
            </div>
            <CardTitle className="text-xl font-bold text-slate-900 mt-1">{product.title}</CardTitle>
            {product.description && (
              <CardDescription className="text-xs text-slate-600 whitespace-pre-wrap mt-1">
                {product.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-sm font-medium text-slate-600">Total Harga</span>
              <span className="text-xl font-bold text-blue-600">
                {formatPriceIdr(product.priceIdr)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Formulir Data Pembeli */}
        <Card className="bg-white shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-bold text-slate-900">Informasi Pembeli</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Masukkan nama dan email untuk menerima link akses produk setelah pembayaran.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                {error}
              </div>
            )}

            {notice && activeSnapToken && activeAccessToken && (
              <div className="mb-4 rounded-lg bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900 space-y-3">
                <p className="font-medium leading-relaxed">⚠️ {notice}</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => triggerSnapPayment(activeSnapToken, activeAccessToken)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
                  >
                    Buka Kembali Pembayaran
                  </Button>
                  <Link href={`/order/${activeAccessToken}`}>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto border-amber-300 bg-white text-amber-900 hover:bg-amber-100 text-xs"
                    >
                      Lihat Status Pesanan →
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="buyerName"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Nama Lengkap *
                </Label>
                <Input
                  id="buyerName"
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Misal: Budi Prakoso"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="buyerEmail"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Alamat Email *
                </Label>
                <Input
                  id="buyerEmail"
                  type="email"
                  required
                  maxLength={254}
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="nama@email.com"
                />
                <p className="text-[11px] text-slate-500">
                  Pastikan email aktif dan benar untuk konfirmasi pembayaran.
                </p>
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isPending ? "Memproses Pesanan..." : `Bayar ${formatPriceIdr(product.priceIdr)}`}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Link kembali ke profil kreator */}
        <div className="text-center">
          <Link
            href={`/${creator.username}`}
            className="text-xs text-slate-500 hover:text-slate-800 transition"
          >
            ← Kembali ke profil {creator.displayName}
          </Link>
        </div>
      </div>
    </>
  );
}
