import { LogoutButton } from "@/components/logout-button";
import { isSessionAuthorized } from "@/lib/auth-validation";
import { auth } from "@openlynk/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!isSessionAuthorized(session)) {
    redirect("/login");
  }

  const user = session!.user;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
              Sesi Terotentikasi
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Dashboard Kreator</h1>
            <p className="text-sm text-slate-600">
              Selamat datang kembali,{" "}
              <span className="font-semibold text-slate-900">{user.name}</span>!
            </p>
          </div>
          <LogoutButton />
        </header>

        <section className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Profil Kreator
            </h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Nama:</span>
                <span className="font-medium text-slate-900">{user.name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 py-2">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-900">{user.email}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Status Email:</span>
                <span className="font-medium text-slate-900">
                  {user.emailVerified ? "Terverifikasi" : "Belum Verifikasi"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Ringkasan Akun
            </h2>
            <p className="mt-4 text-sm text-slate-600">
              Fitur link-in-bio dan monetisasi kreator akan dikembangkan pada tahap selanjutnya.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
