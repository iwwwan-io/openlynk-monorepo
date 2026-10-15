import { CheckoutForm } from "./checkout-form";
import { getMidtransConfig } from "@/lib/midtrans";
import { and, eq, getDb, product, profile } from "@openlynk/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";

interface CheckoutPageProps {
  params: Promise<{
    productId: string;
  }>;
}

export async function generateMetadata(props: CheckoutPageProps): Promise<Metadata> {
  const { productId } = await props.params;
  const db = getDb();

  const [item] = await db
    .select({ title: product.title })
    .from(product)
    .where(and(eq(product.id, productId), eq(product.isActive, true)))
    .limit(1);

  if (!item) {
    return {
      title: "Produk Tidak Ditemukan | Openlynk",
    };
  }

  return {
    title: `Beli ${item.title} | Openlynk`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CheckoutPage(props: CheckoutPageProps) {
  const { productId } = await props.params;
  const db = getDb();

  // KEAMANAN: Kolom delivery_url secara ketat TIDAK BOLEH diseleksi pada halaman checkout!
  const [targetProduct] = await db
    .select({
      id: product.id,
      title: product.title,
      description: product.description,
      priceIdr: product.priceIdr,
      creatorUsername: profile.username,
      creatorName: profile.displayName,
    })
    .from(product)
    .innerJoin(profile, eq(product.profileId, profile.id))
    .where(and(eq(product.id, productId), eq(product.isActive, true)))
    .limit(1);

  if (!targetProduct) {
    notFound();
  }

  const { clientKey, snapScriptUrl } = getMidtransConfig();

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-xl">
        <header className="mb-6 text-center">
          <span className="text-xs font-semibold text-blue-600">Openlynk Checkout</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Selesaikan Pembelian</h1>
        </header>

        <CheckoutForm
          product={{
            id: targetProduct.id,
            title: targetProduct.title,
            description: targetProduct.description,
            priceIdr: targetProduct.priceIdr,
          }}
          creator={{
            username: targetProduct.creatorUsername,
            displayName: targetProduct.creatorName,
          }}
          clientKey={clientKey}
          snapScriptUrl={snapScriptUrl}
        />
      </div>
    </main>
  );
}
