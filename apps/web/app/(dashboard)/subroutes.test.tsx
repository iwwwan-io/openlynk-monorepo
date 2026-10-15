import { renderToStaticMarkup } from "react-dom/server";

import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardLinksPage from "./dashboard/links/page";
import DashboardPage from "./dashboard/page";
import DashboardProductsPage from "./dashboard/products/page";

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
          where: () => {
            const queryObj = {
              then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
                return Promise.resolve(mockDbSelect()).then(resolve, reject);
              },
              limit: () => queryObj,
              orderBy: () => queryObj,
            };
            return queryObj;
          },
        }),
      }),
    }),
    eq: vi.fn(),
    asc: vi.fn(),
    profile: {
      userId: "userId",
      username: "username",
    },
    link: {
      id: "id",
      profileId: "profileId",
      isActive: "isActive",
      position: "position",
      createdAt: "createdAt",
    },
    product: {
      id: "id",
      profileId: "profileId",
      isActive: "isActive",
      position: "position",
      createdAt: "createdAt",
    },
  };
});


describe("Dashboard Sub-routes & Redirect Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("DashboardLinksPage (/dashboard/links)", () => {
    it("redirects unauthorized users to /login", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      await expect(DashboardLinksPage()).rejects.toThrow("REDIRECT:/login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects users without profile to /dashboard", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: { id: "user-no-profile", email: "user@example.com", name: "User No Profile" },
      });
      // db select profile returns empty
      mockDbSelect.mockResolvedValueOnce([]);

      await expect(DashboardLinksPage()).rejects.toThrow("REDIRECT:/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("renders LinkManager when user has a profile", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: { id: "user-123", email: "kreator@example.com", name: "Kreator" },
      });
      // db select profile
      mockDbSelect.mockResolvedValueOnce([{ id: "profile-1", username: "kreator" }]);
      // db select links
      mockDbSelect.mockResolvedValueOnce([
        {
          id: "link-1",
          title: "Instagram",
          url: "https://instagram.com/kreator",
          position: 0,
          isActive: true,
        },
      ]);

      const element = await DashboardLinksPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain("Manajemen Tautan");
      expect(html).toContain("Tambah Tautan Baru");
      expect(html).toContain("Instagram");
    });
  });

  describe("DashboardProductsPage (/dashboard/products)", () => {
    it("redirects unauthorized users to /login", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      await expect(DashboardProductsPage()).rejects.toThrow("REDIRECT:/login");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });

    it("redirects users without profile to /dashboard", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: { id: "user-no-profile", email: "user@example.com", name: "User No Profile" },
      });
      // db select profile returns empty
      mockDbSelect.mockResolvedValueOnce([]);

      await expect(DashboardProductsPage()).rejects.toThrow("REDIRECT:/dashboard");
      expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
    });

    it("renders ProductManager when user has a profile", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: { id: "user-123", email: "kreator@example.com", name: "Kreator" },
      });
      // db select profile
      mockDbSelect.mockResolvedValueOnce([{ id: "profile-1", username: "kreator" }]);
      // db select products
      mockDbSelect.mockResolvedValueOnce([
        {
          id: "prod-1",
          title: "Preset Lightroom",
          description: "Kumpulan preset fotografi",
          priceIdr: 35000,
          deliveryUrl: "https://drive.google.com/file/d/test",
          position: 0,
          isActive: true,
        },
      ]);

      const element = await DashboardProductsPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain("Produk Digital");
      expect(html).toContain("Tambah Produk Digital Baru");
      expect(html).toContain("Preset Lightroom");
      expect(html).toContain("Rp 35.000");
    });
  });

  describe("DashboardPage (/dashboard)", () => {
    it("renders onboarding form if user has no profile", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: { id: "user-onboarding", email: "baru@example.com", name: "User Baru" },
      });
      mockDbSelect.mockResolvedValueOnce([]);

      const element = await DashboardPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain("Halo, User Baru!");
      expect(html).toContain("Buat Profil");
    });

    it("renders summary cards and profile form if user has profile", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: { id: "user-123", email: "budi@example.com", name: "Budi" },
      });
      // db select profile
      mockDbSelect.mockResolvedValueOnce([
        {
          id: "profile-1",
          userId: "user-123",
          username: "budikreator",
          displayName: "Budi Prakoso",
          bio: "Edukator Tech",
          avatarUrl: null,
        },
      ]);
      // db select links (for summary)
      mockDbSelect.mockResolvedValueOnce([
        { id: "l1", isActive: true },
        { id: "l2", isActive: false },
      ]);
      // db select products (for summary)
      mockDbSelect.mockResolvedValueOnce([{ id: "p1", isActive: true }]);

      const element = await DashboardPage();
      const html = renderToStaticMarkup(element);

      expect(html).toContain("Ringkasan &amp; Profil Kreator");
      expect(html).toContain("Tautan Bio");
      expect(html).toContain("Kelola Tautan");
      expect(html).toContain("Produk Digital");
      expect(html).toContain("Kelola Produk Digital");
    });
  });
});
