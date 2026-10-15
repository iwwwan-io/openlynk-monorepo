"use client";

import {
  createLinkAction,
  deleteLinkAction,
  reorderLinkAction,
  toggleLinkActiveAction,
  updateLinkAction,
} from "@/app/actions/link";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@openlynk/ui";
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
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">Tambah Tautan Baru</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Tautan akan langsung muncul di halaman publik bio Anda.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleAddLink} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="newTitle"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Judul Tautan
                </Label>
                <Input
                  id="newTitle"
                  type="text"
                  required
                  maxLength={100}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Instagram Official / Portofolio"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="newUrl"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  URL Tujuan (http:// atau https://)
                </Label>
                <Input
                  id="newUrl"
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://instagram.com/akun"
                />
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="font-semibold">
              {isPending ? "Menambahkan..." : "+ Tambah Tautan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Daftar Tautan */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Kelola Daftar Tautan</CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Ubah urutan tautan menggunakan tombol naik/turun atau nonaktifkan tautan sementara.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {initialLinks.length} Tautan
          </Badge>
        </CardHeader>

        <CardContent className="pt-4">
          {initialLinks.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm font-medium text-slate-600">
                Belum ada tautan yang ditambahkan.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Gunakan formulir di atas untuk menambahkan tautan pertama Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
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
                      <Input
                        type="text"
                        required
                        maxLength={100}
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1"
                        placeholder="Judul tautan"
                      />
                      <Input
                        type="url"
                        required
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="flex-1"
                        placeholder="https://..."
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                        >
                          Simpan
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          className="font-semibold text-slate-700"
                        >
                          Batal
                        </Button>
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
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]"
                            >
                              Nonaktif
                            </Badge>
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
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleToggleActive(item.id)}
                          className={
                            item.isActive
                              ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100"
                              : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }
                        >
                          {item.isActive ? "Aktif" : "Nonaktif"}
                        </Button>

                        {/* Tombol Edit */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(item)}
                          className="text-slate-700"
                        >
                          Edit
                        </Button>

                        {/* Tombol Hapus */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id, item.title)}
                          className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        >
                          Hapus
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
