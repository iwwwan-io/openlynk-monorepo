"use client";

import {
  createLinkAction,
  deleteLinkAction,
  reorderLinkAction,
  toggleLinkActiveAction,
  updateLinkAction,
} from "@/app/actions/link";
import { useState, useTransition } from "react";

interface LinkItemData {
  id: string;
  title: string;
  url: string;
  position: number;
  isActive: boolean;
}

interface LinkManagerProps {
  initialLinks: LinkItemData[];
}

export function LinkManager({ initialLinks }: LinkManagerProps) {
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleAddLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("title", newTitle.trim());
    formData.append("url", newUrl.trim());

    startTransition(async () => {
      const res = await createLinkAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      } else {
        setNewTitle("");
        setNewUrl("");
      }
    });
  };

  const handleToggleActive = (id: string) => {
    setError(null);
    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      const res = await toggleLinkActiveAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  const handleReorder = (id: string, direction: "up" | "down") => {
    setError(null);
    const formData = new FormData();
    formData.append("id", id);
    formData.append("direction", direction);

    startTransition(async () => {
      const res = await reorderLinkAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus tautan "${title}"?`)) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      const res = await deleteLinkAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  const startEdit = (item: LinkItemData) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditUrl(item.url);
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;

    setError(null);
    const formData = new FormData();
    formData.append("id", editingId);
    formData.append("title", editTitle.trim());
    formData.append("url", editUrl.trim());

    startTransition(async () => {
      const res = await updateLinkAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      } else {
        setEditingId(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Form Tambah Tautan */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Tambah Tautan Baru</h2>
        <p className="text-xs text-slate-500">
          Tautan akan langsung muncul di halaman publik bio Anda.
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleAddLink} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="newTitle"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Judul Tautan
              </label>
              <input
                id="newTitle"
                type="text"
                required
                maxLength={100}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Misal: Instagram Official / Portofolio"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label
                htmlFor="newUrl"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                URL Tujuan (http:// atau https://)
              </label>
              <input
                id="newUrl"
                type="url"
                required
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://instagram.com/akun"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
          >
            {isPending ? "Menambahkan..." : "+ Tambah Tautan"}
          </button>
        </form>
      </div>

      {/* Daftar Tautan */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Kelola Daftar Tautan</h2>
            <p className="text-xs text-slate-500">
              Ubah urutan tautan menggunakan tombol naik/turun atau nonaktifkan tautan sementara.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            {initialLinks.length} Tautan
          </span>
        </div>

        {initialLinks.length === 0 ? (
          <div className="mt-8 text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
            <p className="text-sm font-medium text-slate-600">Belum ada tautan yang ditambahkan.</p>
            <p className="mt-1 text-xs text-slate-400">
              Gunakan formulir di atas untuk menambahkan tautan pertama Anda.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {initialLinks.map((item, index) => (
              <div
                key={item.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition ${
                  item.isActive
                    ? "border-slate-200 bg-white"
                    : "border-slate-200 bg-slate-50 opacity-70"
                }`}
              >
                {editingId === item.id ? (
                  <form
                    onSubmit={handleSaveEdit}
                    className="flex-1 space-y-3 sm:space-y-0 sm:flex sm:gap-3"
                  >
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      placeholder="Judul tautan"
                    />
                    <input
                      type="url"
                      required
                      value={editUrl}
                      onChange={(e) => setEditUrl(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      placeholder="https://..."
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Simpan
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 truncate">
                          {item.title}
                        </span>
                        {!item.isActive && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block truncate text-xs text-blue-600 hover:underline"
                      >
                        {item.url}
                      </a>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {/* Tombol Reorder Naik & Turun */}
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          disabled={isPending || index === 0}
                          onClick={() => handleReorder(item.id, "up")}
                          aria-label="Pindahkan ke atas"
                          className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={isPending || index === initialLinks.length - 1}
                          onClick={() => handleReorder(item.id, "down")}
                          aria-label="Pindahkan ke bawah"
                          className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition"
                        >
                          ▼
                        </button>
                      </div>

                      {/* Tombol Toggle Aktif/Nonaktif */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleToggleActive(item.id)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition ${
                          item.isActive
                            ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                            : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </button>

                      {/* Tombol Edit */}
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleDelete(item.id, item.title)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Hapus
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
