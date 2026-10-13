import type { Metadata } from "next";
import { getBaseUrl } from "@/lib/url";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "Openlynk - Platform Link-in-Bio & Monetisasi Kreator",
  description: "Platform link-in-bio open source dan monetisasi kreator untuk pasar Indonesia",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
