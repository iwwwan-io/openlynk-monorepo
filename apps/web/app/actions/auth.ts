"use server";

import { validateLoginInput, validateRegisterInput } from "@/lib/auth-validation";
import { auth } from "@openlynk/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
}

export async function registerAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawInput = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = validateRegisterInput(rawInput);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  let isSuccess = false;

  try {
    const res = await auth.api.signUpEmail({
      body: {
        name: validation.data.name,
        email: validation.data.email,
        password: validation.data.password,
      },
      headers: await headers(),
    });

    if (res) {
      isSuccess = true;
    } else {
      return { success: false, error: "Gagal membuat akun" };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat pendaftaran";
    return { success: false, error: message };
  }

  if (isSuccess) {
    redirect("/dashboard");
  }

  return { success: false, error: "Gagal memproses pendaftaran" };
}

export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const rawInput = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validation = validateLoginInput(rawInput);
  if (!validation.success) {
    return { success: false, error: validation.error };
  }

  let isSuccess = false;

  try {
    const res = await auth.api.signInEmail({
      body: {
        email: validation.data.email,
        password: validation.data.password,
      },
      headers: await headers(),
    });

    if (res) {
      isSuccess = true;
    } else {
      return { success: false, error: "Email atau kata sandi tidak valid" };
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Gagal masuk. Periksa kembali email dan kata sandi.";
    return { success: false, error: message };
  }

  if (isSuccess) {
    redirect("/dashboard");
  }

  return { success: false, error: "Gagal memproses login" };
}

export async function logoutAction(): Promise<void> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch {
    // Abaikan error signOut jika session sudah tidak aktif
  }

  redirect("/login");
}
