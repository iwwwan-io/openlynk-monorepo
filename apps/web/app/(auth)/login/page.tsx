import { isGoogleAuthEnabled } from "@openlynk/auth";
import type { Metadata } from "next";
import React from "react";
import { getOAuthErrorMessage } from "@/lib/oauth-error";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk - Openlynk",
  description: "Masuk ke akun kreator Openlynk Anda",
};

export const dynamic = "force-dynamic";

export interface LoginPageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoginPage(props: LoginPageProps) {
  const resolvedParams = await props.searchParams;
  const rawError = resolvedParams?.error;
  const errorCode = typeof rawError === "string" ? rawError : undefined;
  const errorMessage = getOAuthErrorMessage(errorCode);
  const googleEnabled = isGoogleAuthEnabled();

  return <LoginForm isGoogleAuthEnabled={googleEnabled} initialError={errorMessage} />;
}
