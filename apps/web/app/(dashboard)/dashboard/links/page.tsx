import { LinkManager } from "../link-manager";
import { isSessionAuthorized } from "@/lib/auth-validation";
import { auth } from "@openlynk/auth";
import { asc, eq, getDb, link, profile } from "@openlynk/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function DashboardLinksPage() {
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

  const userLinks = await db
    .select()
    .from(link)
    .where(eq(link.profileId, userProfile.id))
    .orderBy(asc(link.position), asc(link.createdAt));

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="text-xs font-semibold text-blue-600">Link in Bio</span>
          <h1 className="text-2xl font-bold text-slate-900">Manajemen Tautan</h1>
          <p className="text-sm text-slate-600">
            Kelola seluruh tautan eksternal yang tampil pada profil link-in-bio Anda.
          </p>
        </header>

        <section>
          <LinkManager initialLinks={userLinks} />
        </section>
      </div>
    </main>
  );
}
