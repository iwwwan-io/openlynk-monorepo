"use client";

import { updateProfileAction } from "@/app/actions/profile";
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
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
        <div>
          <CardTitle className="text-lg font-bold text-slate-900">Pengaturan Profil</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Perbarui nama tampilan, bio, dan avatar publik Anda.
          </CardDescription>
        </div>
        <Badge variant="secondary" className="font-mono text-xs">
          @{initialData.username}
        </Badge>
      </CardHeader>

      <CardContent className="pt-6">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profileDisplayName" className="text-sm font-medium text-slate-700">
              Nama Tampilan
            </Label>
            <Input
              id="profileDisplayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profileBio" className="text-sm font-medium text-slate-700">
              Bio Singkat
            </Label>
            <Textarea
              id="profileBio"
              rows={2}
              maxLength={160}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tulis bio singkat..."
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>Maksimal 160 karakter</span>
              <span>{bio.length}/160</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profileAvatarUrl" className="text-sm font-medium text-slate-700">
              URL Gambar Avatar (Opsional)
            </Label>
            <Input
              id="profileAvatarUrl"
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/foto-profil.jpg"
            />
          </div>

          <Button type="submit" disabled={isPending} className="font-medium">
            {isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
