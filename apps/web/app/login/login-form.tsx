"use client";

import { validateLoginInput } from "@/lib/auth-validation";
import { authClient } from "@openlynk/auth/client";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@openlynk/ui";
import Link from "next/link";
import React, { useState } from "react";

export interface LoginFormProps {
  isGoogleAuthEnabled?: boolean;
  initialError?: string | null;
}

export function LoginForm({ isGoogleAuthEnabled = false, initialError }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const res = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
        errorCallbackURL: "/login",
      });

      if (res?.error) {
        setError(res.error.message || "Gagal masuk dengan Google. Silakan coba lagi.");
        setIsGoogleLoading(false);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan saat masuk dengan Google.";
      setError(message);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const validation = validateLoginInput({ email, password });
    if (!validation.success) {
      setError(validation.error);
      return;
    }

    setIsLoading(true);

    try {
      const res = await authClient.signIn.email({
        email: validation.data.email,
        password: validation.data.password,
      });

      if (res.error) {
        setError(res.error.message || "Gagal masuk. Periksa kembali email dan kata sandi.");
        setIsLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Terjadi kesalahan saat masuk. Silakan coba lagi.";
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <Card className="w-full max-w-md bg-white shadow-sm">
        <CardHeader className="text-center">
          <div>
            <Link
              href="/"
              className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-600 hover:underline"
            >
              ← Kembali ke Beranda
            </Link>
          </div>
          <CardTitle className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Masuk ke Openlynk
          </CardTitle>
          <CardDescription className="text-sm text-slate-600">
            Kelola profil link-in-bio dan monetisasi kreator Anda
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {isGoogleAuthEnabled && (
            <div className="space-y-4">
              <Button
                type="button"
                variant="outline"
                data-testid="google-signin-button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full h-10 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
                {isGoogleLoading ? "Mengarahkan ke Google..." : "Lanjutkan dengan Google"}
              </Button>

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="relative bg-white px-3 text-xs uppercase tracking-wider text-slate-500">
                  atau dengan email
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Alamat Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kreator@contoh.id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Kata Sandi
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full h-10 font-semibold"
            >
              {isLoading ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="text-center text-sm text-slate-600">
            Belum punya akun?{" "}
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-500">
              Daftar sekarang
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
