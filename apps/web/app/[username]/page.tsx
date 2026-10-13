import { and, asc, eq, getDb, link, profile } from "@openlynk/db";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

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
          <p className="mt-0.5 text-xs font-mono font-medium text-slate-500">
            @{userProfile.username}
          </p>
          {userProfile.bio && (
            <p className="mt-3 max-w-xs text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {userProfile.bio}
            </p>
          )}
        </div>

        {/* Daftar Tautan Aktif */}
        <section className="mt-8 w-full space-y-3.5">
          {activeLinks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 p-6 text-center text-sm text-slate-500">
              Belum ada tautan yang dibagikan saat ini.
            </div>
          ) : (
            activeLinks.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-center font-medium text-slate-800 shadow-sm transition hover:border-blue-400 hover:bg-slate-50 hover:shadow active:scale-[0.99]"
              >
                <span className="truncate text-sm sm:text-base font-semibold group-hover:text-blue-600 transition-colors">
                  {item.title}
                </span>
              </a>
            ))
          )}
        </section>

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
