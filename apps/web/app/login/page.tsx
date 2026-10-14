import { isGoogleAuthEnabled } from "@openlynk/auth";
import type { Metadata } from "next";
import React from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Masuk - Openlynk",
  description: "Masuk ke akun kreator Openlynk Anda",
};

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const googleEnabled = isGoogleAuthEnabled();

  return <LoginForm isGoogleAuthEnabled={googleEnabled} />;
}
