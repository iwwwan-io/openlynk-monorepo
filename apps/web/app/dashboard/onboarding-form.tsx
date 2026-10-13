"use client";

import { createProfileAction } from "@/app/actions/profile";
import { useState, useTransition } from "react";

interface OnboardingFormProps {
  defaultName: string;
}

export function OnboardingForm({ defaultName }: OnboardingFormProps) {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(defaultName);
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("username", username.toLowerCase().trim());
    formData.append("displayName", displayName.trim());
    formData.append("bio", bio.trim());

    startTransition(async () => {
      const res = await createProfileAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="max-w-xl">
        <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
          Langkah Awal
        </div>
        <h2 className="mt-3 text-2xl font-bold text-slate-900">
          Buat Halaman Profil Openlynk Anda
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Pilih username unik untuk halaman publik Anda. Setelah profil dibuat, Anda dapat mulai
          menambahkan dan mengelola tautan.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              Username Kreator
            </label>
            <div className="mt-1.5 flex rounded-lg shadow-sm">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                openlynk.id/
              </span>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="nama_kreator"
                className="block w-full min-w-0 flex-1 rounded-none rounded-r-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              3-30 karakter, hanya huruf kecil (a-z), angka (0-9), dan garis bawah (_).
            </p>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-slate-700">
              Nama Tampilan
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama Lengkap atau Brand"
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
              Bio Singkat (Opsional)
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={160}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan siapa Anda dalam beberapa kalimat..."
              className="mt-1.5 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>Maksimal 160 karakter</span>
              <span>{bio.length}/160</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition"
          >
            {isPending ? "Menyimpan Profil..." : "Buat Profil Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}
