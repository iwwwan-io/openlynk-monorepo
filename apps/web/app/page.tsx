import { Button } from "@openlynk/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl space-y-6">
        <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
          Openlynk • Open Source
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Link-in-Bio &amp; Monetisasi Kreator Indonesia
        </h1>
        <p className="text-lg text-slate-600">
          Solusi terdesentralisasi, transparan, dan berlisensi AGPL-3.0 untuk kreator konten di
          seluruh Indonesia.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button variant="primary">Mulai Sekarang</Button>
          <Button variant="outline">Pelajari Dokumentasi</Button>
        </div>
      </div>
    </main>
  );
}
