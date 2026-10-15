import { ProductManager } from "./product-manager";
import { isSessionAuthorized } from "@/lib/auth-validation";
import { auth } from "@openlynk/auth";
import { asc, eq, getDb, product, profile } from "@openlynk/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardProductsPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!isSessionAuthorized(session) || !session?.user) {
    redirect("/login");
  }

  const db = getDb();
  const [userProfile] = await db
    .select()
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  if (!userProfile) {
    redirect("/dashboard");
  }

  const userProducts = await db
    .select()
    .from(product)
    .where(eq(product.profileId, userProfile.id))
    .orderBy(asc(product.position), asc(product.createdAt));

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold text-blue-600">Monetisasi Kreator</span>
          <h1 className="text-2xl font-bold text-slate-900">Produk Digital</h1>
          <p className="text-sm text-slate-600">
            Kelola produk digital, ebook, preset, atau template yang Anda jual langsung di halaman
            profil kreator Openlynk.
          </p>
        </header>

        <section>
          <ProductManager initialProducts={userProducts} />
        </section>
      </div>
    </main>
  );
}
