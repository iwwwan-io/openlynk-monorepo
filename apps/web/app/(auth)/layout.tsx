import { isSessionAuthorized } from "@/lib/auth-validation";
import { auth } from "@openlynk/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (isSessionAuthorized(session) && session?.user) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
