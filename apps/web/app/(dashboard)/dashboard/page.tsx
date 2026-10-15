import { logoutAction } from "@/app/actions/auth";
import { OnboardingForm } from "./onboarding-form";
import { ProfileForm } from "./profile-form";
import { isSessionAuthorized } from "@/lib/auth-validation";
import { auth } from "@openlynk/auth";
import { eq, getDb, link, product, profile } from "@openlynk/db";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@openlynk/ui";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!isSessionAuthorized(session) || !session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const db = getDb();

  // Ambil profil kreator milik user yang sedang aktif
  const [userProfile] = await db.select().from(profile).where(eq(profile.userId, user.id)).limit(1);

  // Jika belum memiliki profil, tampilkan formulir onboarding
  if (!userProfile) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 md:p-10">
        <div className="mx-auto max-w-3xl space-y-6">
          <header className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <span className="text-xs font-semibold text-blue-600">Openlynk Dashboard</span>
              <h1 className="text-xl font-bold text-slate-900">Halo, {user.name}!</h1>
            </div>
            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              >
                Keluar
              </Button>
            </form>
          </header>

          <OnboardingForm defaultName={user.name} />
        </div>
      </main>
    );
  }

  // Ambil ringkasan data tautan dan produk milik kreator
  const userLinks = await db
    .select({ id: link.id, isActive: link.isActive })
    .from(link)
    .where(eq(link.profileId, userProfile.id));

  const userProducts = await db
    .select({ id: product.id, isActive: product.isActive })
    .from(product)
    .where(eq(product.profileId, userProfile.id));

  const activeLinksCount = userLinks.filter((l) => l.isActive).length;
  const activeProductsCount = userProducts.filter((p) => p.isActive).length;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Dashboard */}
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                Profil Aktif
              </Badge>
              <span className="text-xs font-mono text-slate-500">@{userProfile.username}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Ringkasan & Profil Kreator</h1>
            <p className="text-sm text-slate-600">
              Selamat datang kembali,{" "}
              <span className="font-semibold text-slate-900">{userProfile.displayName}</span>!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/${userProfile.username}`} target="_blank" rel="noopener noreferrer">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                <span>Lihat Halaman Publik</span>
                <span>↗</span>
              </Button>
            </Link>

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              >
                Keluar
              </Button>
            </form>
          </div>
        </header>

        {/* Kartu Ringkasan Statistik */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tautan Bio
              </span>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {userLinks.length}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({activeLinksCount} aktif)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-500 mb-3">
                Tautan eksternal yang ditampilkan di halaman bio kreator Anda.
              </p>
              <Link href="/dashboard/links">
                <Button variant="outline" size="sm" className="w-full text-xs font-medium">
                  Kelola Tautan ↗
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Produk Digital
              </span>
              <CardTitle className="text-2xl font-bold text-slate-900">
                {userProducts.length}{" "}
                <span className="text-xs font-normal text-slate-500">
                  ({activeProductsCount} aktif)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-slate-500 mb-3">
                Katalog ebook, preset, atau template digital yang siap dijual.
              </p>
              <Link href="/dashboard/products">
                <Button variant="outline" size="sm" className="w-full text-xs font-medium">
                  Kelola Produk Digital ↗
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        {/* Pengaturan Profil Kreator */}
        <section>
          <ProfileForm
            initialData={{
              username: userProfile.username,
              displayName: userProfile.displayName,
              bio: userProfile.bio,
              avatarUrl: userProfile.avatarUrl,
            }}
          />
        </section>
      </div>
    </main>
  );
}
