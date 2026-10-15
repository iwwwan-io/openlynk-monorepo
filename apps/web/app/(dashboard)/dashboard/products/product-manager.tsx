"use client";

import {
  createProductAction,
  deleteProductAction,
  reorderProductAction,
  toggleProductActiveAction,
  updateProductAction,
} from "@/app/actions/product";
import { formatPriceIdr } from "@/lib/product-validation";
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
  Textarea,
} from "@openlynk/ui";
import React, { useState, useTransition } from "react";

export interface ProductItemData {
  id: string;
  title: string;
  description: string | null;
  priceIdr: number;
  deliveryUrl: string;
  position: number;
  isActive: boolean;
}

interface ProductManagerProps {
  initialProducts?: ProductItemData[];
}

export function ProductManager({ initialProducts = [] }: ProductManagerProps) {

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPrice, setNewPrice] = useState("25000");
  const [newDeliveryUrl, setNewDeliveryUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDeliveryUrl, setEditDeliveryUrl] = useState("");

  const [isPending, startTransition] = useTransition();

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.append("title", newTitle.trim());
    formData.append("description", newDescription.trim());
    formData.append("price_idr", newPrice.trim());
    formData.append("delivery_url", newDeliveryUrl.trim());

    startTransition(async () => {
      const res = await createProductAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      } else {
        setNewTitle("");
        setNewDescription("");
        setNewPrice("25000");
        setNewDeliveryUrl("");
      }
    });
  };

  const handleToggleActive = (id: string) => {
    setError(null);
    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      const res = await toggleProductActiveAction(formData);
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
      const res = await reorderProductAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (!window.confirm(`Yakin ingin menghapus produk digital "${title}"?`)) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.append("id", id);

    startTransition(async () => {
      const res = await deleteProductAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      }
    });
  };

  const startEdit = (item: ProductItemData) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditPrice(String(item.priceIdr));
    setEditDeliveryUrl(item.deliveryUrl);
  };

  const handleSaveEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;

    setError(null);
    const formData = new FormData();
    formData.append("id", editingId);
    formData.append("title", editTitle.trim());
    formData.append("description", editDescription.trim());
    formData.append("price_idr", editPrice.trim());
    formData.append("delivery_url", editDeliveryUrl.trim());

    startTransition(async () => {
      const res = await updateProductAction(formData);
      if (!res.success && res.error) {
        setError(res.error);
      } else {
        setEditingId(null);
      }
    });
  };

  const parsedNewPrice = Number(newPrice);
  const isNewPriceValidNumber = !isNaN(parsedNewPrice) && parsedNewPrice >= 0;

  return (
    <div className="space-y-6">
      {/* Form Tambah Produk Baru */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900">
            Tambah Produk Digital Baru
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Jual ebook, preset, template, atau link kursus. Pembayaran akan terhubung kelak.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleAddProduct} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="newProductTitle"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Judul Produk *
                </Label>
                <Input
                  id="newProductTitle"
                  type="text"
                  required
                  maxLength={100}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Misal: Ebook Panduan TypeScript Modern 2026"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="newProductDesc"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Deskripsi Produk (Opsional, maks 500 karakter)
                </Label>
                <Textarea
                  id="newProductDesc"
                  maxLength={500}
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Penjelasan ringkas isi produk digital Anda..."
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="newProductPrice"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Harga (Integer IDR) *
                </Label>
                <Input
                  id="newProductPrice"
                  type="number"
                  required
                  min={1000}
                  max={10000000}
                  step={1000}
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="25000"
                />
                <p className="text-[11px] text-slate-500">
                  {isNewPriceValidNumber
                    ? `Format Rupiah: ${formatPriceIdr(parsedNewPrice)}`
                    : "Min Rp 1.000, Maks Rp 10.000.000"}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="newProductDeliveryUrl"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  URL Pengiriman (Delivery URL) *
                </Label>
                <Input
                  id="newProductDeliveryUrl"
                  type="url"
                  required
                  maxLength={500}
                  value={newDeliveryUrl}
                  onChange={(e) => setNewDeliveryUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="text-[11px] text-slate-400">
                  Hanya terlihat oleh Anda (tidak pernah diekspos di halaman publik).
                </p>
              </div>
            </div>

            <Button type="submit" disabled={isPending} className="font-semibold">
              {isPending ? "Menambahkan..." : "+ Tambah Produk"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Daftar Produk Digital */}
      <Card className="bg-white shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">
              Daftar Produk Digital
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Kelola produk aktif, harga, serta urutan tampilan di halaman profil kreator Anda.
            </CardDescription>
          </div>
          <Badge variant="secondary" className="font-semibold">
            {initialProducts.length} Produk
          </Badge>
        </CardHeader>

        <CardContent className="pt-4">
          {initialProducts.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm font-medium text-slate-600">
                Belum ada produk digital yang ditambahkan.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Gunakan formulir di atas untuk mendaftarkan produk digital pertama Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {initialProducts.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex flex-col gap-3 rounded-xl border p-4 transition ${
                    item.isActive
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50 opacity-70"
                  }`}
                >
                  {editingId === item.id ? (
                    <form onSubmit={handleSaveEdit} className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Judul Produk</Label>
                          <Input
                            type="text"
                            required
                            maxLength={100}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Deskripsi</Label>
                          <Textarea
                            maxLength={500}
                            rows={2}
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Harga (IDR)</Label>
                          <Input
                            type="number"
                            required
                            min={1000}
                            max={10000000}
                            step={1000}
                            value={editPrice}
                            onChange={(e) => setEditPrice(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">URL Pengiriman</Label>
                          <Input
                            type="url"
                            required
                            maxLength={500}
                            value={editDeliveryUrl}
                            onChange={(e) => setEditDeliveryUrl(e.target.value)}
                          />
                        </div>
                      </div>

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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-slate-900 truncate">
                            {item.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold"
                          >
                            {formatPriceIdr(item.priceIdr)}
                          </Badge>
                          {!item.isActive && (
                            <Badge
                              variant="outline"
                              className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]"
                            >
                              Nonaktif
                            </Badge>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-600 line-clamp-2">
                            {item.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <span className="font-medium text-slate-500">Delivery URL:</span>
                          <span className="truncate max-w-xs">{item.deliveryUrl}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        {/* Tombol Reorder Naik & Turun */}
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                          <button
                            type="button"
                            disabled={isPending || index === 0}
                            onClick={() => handleReorder(item.id, "up")}
                            aria-label="Pindahkan produk ke atas"
                            className="rounded p-1 text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-30 transition"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={isPending || index === initialProducts.length - 1}
                            onClick={() => handleReorder(item.id, "down")}
                            aria-label="Pindahkan produk ke bawah"
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
                              ? "border-green-300 bg-green-50 text-green-700 hover:bg-green-100 text-xs"
                              : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs"
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
                          className="text-slate-700 text-xs"
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
                          className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs"
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
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
