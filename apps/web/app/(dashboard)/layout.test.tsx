import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLayout from "./layout";

const mockGetSession = vi.fn();
const mockRedirect = vi.fn();
const mockDbSelect = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
  usePathname: () => "/dashboard",
}));

vi.mock("@openlynk/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("@openlynk/db", () => {
  return {
    getDb: () => ({
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => mockDbSelect(),
          }),
        }),
      }),
    }),
    eq: vi.fn(),
    profile: {
      userId: "userId",
      username: "username",
    },
  };
});

describe("DashboardLayout Server Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects unauthorized users to /login", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    await expect(DashboardLayout({ children: <div>Konten</div> })).rejects.toThrow(
      "REDIRECT:/login"
    );

    expect(mockRedirect).toHaveBeenCalledWith("/login");
  });

  it("renders layout navigation with public link when user has profile", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: {
        id: "user-123",
        name: "Budi",
        email: "budi@example.com",
      },
    });

    mockDbSelect.mockResolvedValueOnce([{ username: "budikreator" }]);

    const element = await DashboardLayout({
      children: <div data-testid="dashboard-content">Halo Dashboard</div>,
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Openlynk");
    expect(html).toContain("Lihat Halaman Publik");
    expect(html).toContain("/budikreator");
    expect(html).toContain("Keluar");
    expect(html).toContain("Profil &amp; Ringkasan");
    expect(html).toContain("Tautan");
    expect(html).toContain("Produk Digital");
    expect(html).toContain("Halo Dashboard");
  });

  it("renders layout navigation without public link during onboarding", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: {
        id: "user-456",
        name: "Ani",
        email: "ani@example.com",
      },
    });

    mockDbSelect.mockResolvedValueOnce([]);

    const element = await DashboardLayout({
      children: <div>Formulir Onboarding</div>,
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Openlynk");
    expect(html).not.toContain("Lihat Halaman Publik");
    expect(html).not.toContain("Produk Digital");
    expect(html).toContain("Keluar");
    expect(html).toContain("Formulir Onboarding");
  });
});
