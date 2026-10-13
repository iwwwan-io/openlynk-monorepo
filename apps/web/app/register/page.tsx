"use client";

import { registerAction, type AuthActionResult } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState } from "react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    registerAction,
    null
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center">
          <Link
            href="/"
            className="inline-block text-xs font-semibold uppercase tracking-wider text-blue-600 hover:underline"
          >
            ← Kembali ke Beranda
          </Link>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
            Daftar Akun Openlynk
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Mulai bangun link-in-bio dan monetisasi karya Anda
          </p>
        </div>

        {state && !state.success && state.error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          >
            {state.error}
          </div>
        )}

        <form action={formAction} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Nama Lengkap
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                placeholder="Budi Prakoso"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="kreator@contoh.id"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Kata Sandi (Minimal 8 karakter)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                placeholder="••••••••"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Mendaftarkan..." : "Daftar Akun"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-600">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
