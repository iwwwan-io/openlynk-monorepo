import Link from "next/link";
import { Badge, Button } from "@openlynk/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <div>
          <Badge variant="secondary" className="px-3 py-1 text-xs font-semibold">
            Openlynk • Open Source
          </Badge>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Link-in-Bio &amp; Monetisasi Kreator Indonesia
        </h1>
        <p className="text-lg text-slate-600">
          Solusi terdesentralisasi, transparan, dan berlisensi AGPL-3.0 untuk kreator konten di
          seluruh Indonesia.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild>
            <Link href="/register">Mulai Sekarang</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">Masuk ke Akun</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
