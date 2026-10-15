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
          <a href="/register">
            <Button>Mulai Sekarang</Button>
          </a>
          <a href="/login">
            <Button variant="outline">Masuk ke Akun</Button>
          </a>
        </div>
      </div>
    </main>
  );
}
