import { logoutAction } from "@/app/actions/auth";
import { isSessionAuthorized } from "@/lib/auth-validation";
import { auth } from "@openlynk/auth";
import { eq, getDb, profile } from "@openlynk/db";
import { Button } from "@openlynk/ui";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import React from "react";
import { DashboardTabs } from "./dashboard/dashboard-tabs";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!isSessionAuthorized(session) || !session?.user) {
    redirect("/login");
  }

  const db = getDb();
  const [userProfile] = await db
    .select({ username: profile.username })
    .from(profile)
    .where(eq(profile.userId, session.user.id))
    .limit(1);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Navigasi Dasar Dashboard */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-lg font-bold tracking-tight text-slate-900">
              Openlynk
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {userProfile?.username && (
              <Link href={`/${userProfile.username}`} target="_blank" rel="noopener noreferrer">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs"
                >
                  <span>Lihat Halaman Publik</span>
                  <span>↗</span>
                </Button>
              </Link>
            )}

            <form action={logoutAction}>
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs"
              >
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Navigasi Tab Sub-route Dashboard */}
      {userProfile?.username && <DashboardTabs />}

      {/* Konten Halaman */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

