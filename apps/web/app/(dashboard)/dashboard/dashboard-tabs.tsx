"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

export function DashboardTabs() {
  let pathname = "/dashboard";
  try {
    const current = usePathname();
    if (current) {
      pathname = current;
    }
  } catch {
    pathname = "/dashboard";
  }

  const tabs = [
    {
      name: "Profil & Ringkasan",
      href: "/dashboard",
      exact: true,
    },
    {
      name: "Tautan Bio",
      href: "/dashboard/links",
      exact: false,
    },
    {
      name: "Produk Digital",
      href: "/dashboard/products",
      exact: false,
    },
  ];

  const isTabActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl gap-6 px-4 sm:px-6">
        {tabs.map((tab) => {
          const active = isTabActive(tab.href, tab.exact);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-blue-600 text-blue-600 font-semibold"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
