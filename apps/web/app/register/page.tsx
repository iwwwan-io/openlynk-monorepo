import { isGoogleAuthEnabled } from "@openlynk/auth";
import type { Metadata } from "next";
import React from "react";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Daftar Akun - Openlynk",
  description: "Daftar akun kreator baru di Openlynk",
};

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  const googleEnabled = isGoogleAuthEnabled();

  return <RegisterForm isGoogleAuthEnabled={googleEnabled} />;
}
