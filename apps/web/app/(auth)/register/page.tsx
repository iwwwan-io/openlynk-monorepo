import { isGoogleAuthEnabled } from "@openlynk/auth";
import type { Metadata } from "next";
import React from "react";
import { getOAuthErrorMessage } from "@/lib/oauth-error";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar Akun - Openlynk",
  description: "Daftar akun kreator baru di Openlynk",
};

export const dynamic = "force-dynamic";

export interface RegisterPageProps {
  params?: Promise<Record<string, string | string[] | undefined>>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RegisterPage(props: RegisterPageProps) {
  const resolvedParams = await props.searchParams;
  const rawError = resolvedParams?.error;
  const errorCode = typeof rawError === "string" ? rawError : undefined;
  const errorMessage = getOAuthErrorMessage(errorCode);
  const googleEnabled = isGoogleAuthEnabled();

  return <RegisterForm isGoogleAuthEnabled={googleEnabled} initialError={errorMessage} />;
}
