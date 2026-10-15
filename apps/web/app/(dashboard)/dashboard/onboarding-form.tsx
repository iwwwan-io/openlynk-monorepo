"use client";

import { createProfileAction } from "@/app/actions/profile";
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
    <Card className="max-w-xl bg-white shadow-sm">
      <CardHeader>
        <div>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Langkah Awal
          </Badge>
        </div>
        <CardTitle className="mt-2 text-2xl font-bold text-slate-900">
          Buat Halaman Profil Openlynk Anda
        </CardTitle>
        <CardDescription className="text-sm text-slate-600">
          Pilih username unik untuk halaman publik Anda. Setelah profil dibuat, Anda dapat mulai
          menambahkan dan mengelola tautan.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-sm font-medium text-slate-700">
              Username Kreator
            </Label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-slate-50 px-3 text-sm text-slate-500">
                openlynk.id/
              </span>
              <Input
                id="username"
                name="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                placeholder="nama_kreator"
                className="rounded-l-none"
              />
            </div>
            <p className="text-xs text-slate-500">
              3-30 karakter, hanya huruf kecil (a-z), angka (0-9), dan garis bawah (_).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="displayName" className="text-sm font-medium text-slate-700">
              Nama Tampilan
            </Label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Nama Lengkap atau Brand"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio" className="text-sm font-medium text-slate-700">
              Bio Singkat (Opsional)
            </Label>
            <Textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={160}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ceritakan siapa Anda dalam beberapa kalimat..."
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Maksimal 160 karakter</span>
              <span>{bio.length}/160</span>
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="w-full sm:w-auto font-semibold">
            {isPending ? "Menyimpan Profil..." : "Buat Profil Sekarang"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
