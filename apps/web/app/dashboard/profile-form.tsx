"use client";

import { updateProfileAction } from "@/app/actions/profile";
import { useState, useTransition } from "react";

interface ProfileFormProps {
  initialData: {
    username: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
  };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialData.displayName);
  const [bio, setBio] = useState(initialData.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(initialData.avatarUrl || "");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const formData = new FormData();
    formData.append("displayName", displayName.trim());
    formData.append("bio", bio.trim());
    formData.append("avatarUrl", avatarUrl.trim());

    startTransition(async () => {
      const res = await updateProfileAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      } else {
        setSuccessMsg("Profil berhasil diperbarui!");
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pengaturan Profil</h2>
          <p className="text-xs text-slate-500">
            Perbarui nama tampilan, bio, dan avatar publik Anda.
          </p>
        </div>
        <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-medium text-slate-700">
          @{initialData.username}
        </span>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="profileDisplayName" className="block text-sm font-medium text-slate-700">
            Nama Tampilan
          </label>
          <input
            id="profileDisplayName"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="profileBio" className="block text-sm font-medium text-slate-700">
            Bio Singkat
          </label>
          <textarea
            id="profileBio"
            rows={2}
            maxLength={160}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tulis bio singkat..."
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="mt-1 flex justify-between text-xs text-slate-500">
            <span>Maksimal 160 karakter</span>
            <span>{bio.length}/160</span>
          </div>
        </div>

        <div>
          <label htmlFor="profileAvatarUrl" className="block text-sm font-medium text-slate-700">
            URL Gambar Avatar (Opsional)
          </label>
          <input
            id="profileAvatarUrl"
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://example.com/foto-profil.jpg"
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
        >
          {isPending ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>
    </div>
  );
}
