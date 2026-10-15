"use client";

import { Button } from "@openlynk/ui";
import { useRouter } from "next/navigation";
import React, { useTransition } from "react";

export function OrderStatusRefresh() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      variant="outline"
      className="w-full border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
    >
      {isPending ? "Memeriksa Status..." : "↻ Muat Ulang Status Pembayaran"}
    </Button>
  );
}
