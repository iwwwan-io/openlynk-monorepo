import { formatPriceIdr } from "@/lib/product-validation";
import { and, asc, eq, getDb, link, product, profile } from "@openlynk/db";
import { Badge, Button, Card } from "@openlynk/ui";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

interface PublicProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

/**
 * Metadata SEO dinamis untuk halaman profil kreator.
 */
export async function generateMetadata(props: PublicProfilePageProps): Promise<Metadata> {
  const { username } = await props.params;
  const normalizedUsername = username.toLowerCase();
  const db = getDb();

  const [userProfile] = await db
    .select({
      displayName: profile.displayName,
      username: profile.username,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
    })
    .from(profile)
    .where(eq(profile.username, normalizedUsername))
    .limit(1);

  if (!userProfile) {
    return {
      title: "Profil Tidak Ditemukan | Openlynk",
      description: "Halaman kreator tidak ditemukan di Openlynk.",
    };
  }

  const title = `${userProfile.displayName} (@${userProfile.username}) | Openlynk`;
  const description =
    userProfile.bio ||
    `Kunjungi halaman resmi dan temukan seluruh tautan dari ${userProfile.displayName} di Openlynk.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/${userProfile.username}`,
      images: userProfile.avatarUrl ? [userProfile.avatarUrl] : undefined,
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: userProfile.avatarUrl ? [userProfile.avatarUrl] : undefined,
    },
  };
}

/**
 * Server Component untuk halaman publik link-in-bio [username].
 */
export default async function PublicProfilePage(props: PublicProfilePageProps) {
  const { username } = await props.params;
  const normalizedUsername = username.toLowerCase();
  const db = getDb();

  const [userProfile] = await db
    .select()
    .from(profile)
    .where(eq(profile.username, normalizedUsername))
    .limit(1);

  if (!userProfile) {
    notFound();
  }

  // Ambil hanya tautan yang aktif, diurutkan berdasarkan posisi dan waktu pembuatan
  const activeLinks = await db
    .select()
    .from(link)
    .where(and(eq(link.profileId, userProfile.id), eq(link.isActive, true)))
    .orderBy(asc(link.position), asc(link.createdAt));

  // KEAMANAN: Kolom delivery_url secara ketat TIDAK boleh diseleksi pada query halaman publik
  const activeProducts = await db
    .select({
      id: product.id,
      title: product.title,
      description: product.description,
      priceIdr: product.priceIdr,
      position: product.position,
    })
    .from(product)
    .where(and(eq(product.profileId, userProfile.id), eq(product.isActive, true)))
    .orderBy(asc(product.position), asc(product.createdAt));

  // Ambil inisial nama untuk fallback avatar
  const initial = (userProfile.displayName.trim()[0] || "U").toUpperCase();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-12 sm:py-16">
      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Avatar Kreator */}
        <div className="relative">
          {userProfile.avatarUrl ? (
            <img
              src={userProfile.avatarUrl}
              alt={userProfile.displayName}
              className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-md"
            />
          ) : (
            <div
              aria-label={`Inisial ${userProfile.displayName}`}
              className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-gradient-to-tr from-blue-600 to-indigo-600 text-3xl font-bold text-white shadow-md select-none"
            >
              {initial}
            </div>
          )}
        </div>

        {/* Informasi Kreator */}
        <div className="mt-4 text-center">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {userProfile.displayName}
          </h1>
          <div className="mt-1 flex justify-center">
            <Badge variant="secondary" className="font-mono text-xs">
              @{userProfile.username}
            </Badge>
          </div>
          {userProfile.bio && (
            <p className="mt-3 max-w-xs text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {userProfile.bio}
            </p>
          )}
        </div>

        {/* Daftar Tautan Aktif */}
        <section className="mt-8 w-full space-y-3.5">
          {activeLinks.length === 0 ? (
            <Card className="border-dashed bg-white/60 p-6 text-center text-sm text-slate-500 shadow-none">
              Belum ada tautan yang dibagikan saat ini.
            </Card>
          ) : (
            activeLinks.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block w-full"
              >
                <Card className="flex w-full items-center justify-center p-3.5 text-center transition hover:border-blue-400 hover:bg-slate-50 hover:shadow active:scale-[0.99]">
                  <span className="truncate text-sm sm:text-base font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </span>
                </Card>
              </a>
            ))
          )}
        </section>

        {/* Daftar Produk Digital Aktif */}
        {activeProducts.length > 0 && (
          <section className="mt-8 w-full space-y-3.5" aria-label="Produk Digital">
            <div className="flex items-center gap-2 px-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Produk Digital
              </h2>
            </div>
            <div className="space-y-3">
              {activeProducts.map((prod) => (
                <Card key={prod.id} className="p-4 bg-white shadow-sm border-slate-200">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                        {prod.title}
                      </h3>
                      <span className="shrink-0 font-bold text-sm text-blue-600">
                        {formatPriceIdr(prod.priceIdr)}
                      </span>
                    </div>
                    {prod.description && (
                      <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {prod.description}
                      </p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <Button
                        type="button"
                        disabled
                        size="sm"
                        variant="outline"
                        className="w-full sm:w-auto text-xs opacity-75 cursor-not-allowed border-slate-300 bg-slate-100 text-slate-600"
                      >
                        Segera hadir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Footer Branding */}
        <footer className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition"
          >
            <span>Dibuat dengan</span>
            <span className="font-bold text-slate-700">Openlynk</span>
          </Link>
        </footer>
      </div>
    </main>
  );
}
