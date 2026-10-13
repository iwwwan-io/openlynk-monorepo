import { logoutAction } from "@/app/actions/auth";
import { LinkManager } from "@/app/dashboard/link-manager";
import { OnboardingForm } from "@/app/dashboard/onboarding-form";
import { ProfileForm } from "@/app/dashboard/profile-form";
import { isSessionAuthorized } from "@/lib/auth-validation";
import { auth } from "@openlynk/auth";
import { asc, eq, getDb, link, profile } from "@openlynk/db";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

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
              <button
                type="submit"
                className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
              >
                Keluar
              </button>
            </form>
          </header>

          <OnboardingForm defaultName={user.name} />
        </div>
      </main>
    );
  }

  // Jika profil sudah ada, ambil semua tautan milik profil ini
  const userLinks = await db
    .select()
    .from(link)
    .where(eq(link.profileId, userProfile.id))
    .orderBy(asc(link.position), asc(link.createdAt));

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header Dashboard */}
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                Profil Aktif
              </span>
              <span className="text-xs font-mono text-slate-500">@{userProfile.username}</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Dashboard Kreator</h1>
            <p className="text-sm text-slate-600">
              Selamat datang kembali,{" "}
              <span className="font-semibold text-slate-900">{userProfile.displayName}</span>!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${userProfile.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-blue-600 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
            >
              <span>Lihat Halaman Publik</span>
              <span>↗</span>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-700 hover:bg-red-100 transition"
              >
                Keluar
              </button>
            </form>
          </div>
        </header>

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

        {/* Manajemen Tautan (Link-in-Bio) */}
        <section>
          <LinkManager initialLinks={userLinks} />
        </section>
      </div>
    </main>
  );
}
