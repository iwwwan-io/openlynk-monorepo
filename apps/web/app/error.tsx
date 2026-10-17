"use client";

import { Button } from "@openlynk/ui";
import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md space-y-4 rounded-xl border border-red-200 bg-white p-6 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 text-xl font-bold">
          !
        </div>
        <h2 className="text-lg font-bold text-slate-900">Terjadi Kesalahan</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Maaf, terjadi gangguan saat memproses permintaan Anda. Silakan coba kembali beberapa saat
          lagi.
        </p>
        <div className="pt-2">
          <Button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
          >
            Coba Lagi ↻
          </Button>
        </div>
      </div>
    </div>
  );
}
