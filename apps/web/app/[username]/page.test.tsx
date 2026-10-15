import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicProfilePage from "./page";

const mockNotFound = vi.fn();
const mockDbSelect = vi.fn();
const selectCalls: unknown[] = [];

vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("@openlynk/db", () => {
  return {
    getDb: () => ({
      select: (projection?: unknown) => {
        selectCalls.push(projection);
        const queryObj = {
          then: (resolve: (val: unknown) => unknown, reject?: (err: unknown) => unknown) => {
            return Promise.resolve(mockDbSelect()).then(resolve, reject);
          },
          from: () => queryObj,
          where: () => queryObj,
          limit: () => queryObj,
          orderBy: () => queryObj,
        };
        return queryObj;
      },
    }),
    eq: vi.fn(),
    and: vi.fn(),
    asc: vi.fn(),
    profile: {
      id: "profile.id",
      userId: "profile.userId",
      username: "profile.username",
      displayName: "profile.displayName",
      bio: "profile.bio",
      avatarUrl: "profile.avatarUrl",
    },
    link: {
      id: "link.id",
      profileId: "link.profileId",
      title: "link.title",
      url: "link.url",
      position: "link.position",
      isActive: "link.isActive",
      createdAt: "link.createdAt",
    },
    product: {
      id: "product.id",
      profileId: "product.profileId",
      title: "product.title",
      description: "product.description",
      priceIdr: "product.priceIdr",
      deliveryUrl: "product.deliveryUrl",
      position: "product.position",
      isActive: "product.isActive",
      createdAt: "product.createdAt",
    },
  };
});

describe("PublicProfilePage (/[username]) & Security Checks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCalls.length = 0;
  });

  it("throws notFound() if creator profile is not found in database", async () => {
    mockDbSelect.mockResolvedValueOnce([]); // no profile

    await expect(
      PublicProfilePage({ params: Promise.resolve({ username: "unknown_user" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renders active links and active products with formatted IDR price and disabled 'Segera hadir' button", async () => {
    const secretUrl = "https://secret-storage.openlynk.id/vault/course-pack-secret.zip";

    // 1. Profile query
    mockDbSelect.mockResolvedValueOnce([
      {
        id: "profile-1",
        username: "kreator",
        displayName: "Kreator Indonesia",
        bio: "Bio kreator resmi.",
        avatarUrl: null,
      },
    ]);

    // 2. Links query
    mockDbSelect.mockResolvedValueOnce([
      {
        id: "link-1",
        title: "Kanal YouTube",
        url: "https://youtube.com/@kreator",
        isActive: true,
      },
    ]);

    // 3. Products query (simulating data returned with title, desc, price)
    mockDbSelect.mockResolvedValueOnce([
      {
        id: "prod-1",
        title: "Ebook Panduan Belajar Next.js",
        description: "Panduan lengkap dari dasar hingga mahir.",
        priceIdr: 25000,
        position: 0,
      },
      {
        id: "prod-2",
        title: "Preset Lightroom Masterclass",
        description: null,
        priceIdr: 100000,
        position: 1,
      },
    ]);

    const element = await PublicProfilePage({
      params: Promise.resolve({ username: "kreator" }),
    });
    const html = renderToStaticMarkup(element);

    // Profile info
    expect(html).toContain("Kreator Indonesia");
    expect(html).toContain("@kreator");
    expect(html).toContain("Bio kreator resmi.");

    // Link info
    expect(html).toContain("Kanal YouTube");

    // Product info
    expect(html).toContain("Produk Digital");
    expect(html).toContain("Ebook Panduan Belajar Next.js");
    expect(html).toContain("Panduan lengkap dari dasar hingga mahir.");
    expect(html).toContain("Rp 25.000");

    expect(html).toContain("Preset Lightroom Masterclass");
    expect(html).toContain("Rp 100.000");

    // Button "Beli" linking to checkout
    expect(html).toContain("Beli");
    expect(html).toContain("/checkout/prod-1");
    expect(html).toContain("/checkout/prod-2");


    // CRITICAL SECURITY ASSERTIONS:
    // 1. Check that query projection NEVER asked for deliveryUrl / delivery_url
    const productSelection = selectCalls.find(
      (call) => typeof call === "object" && call !== null && "title" in call
    );
    expect(productSelection).toBeDefined();
    if (typeof productSelection === "object" && productSelection !== null) {
      expect(productSelection).not.toHaveProperty("deliveryUrl");
      expect(productSelection).not.toHaveProperty("delivery_url");
    }

    // 2. Check that no secret delivery url appears in the rendered output
    expect(html).not.toContain("deliveryUrl");
    expect(html).not.toContain("delivery_url");
    expect(html).not.toContain(secretUrl);
  });

  it("KEAMANAN: strictly ensures delivery_url never leaks into HTML even if secretly passed in mock data", async () => {
    const leakAttemptUrl = "https://sensitive-drive.internal/files/secret-download-key-xyz987";

    mockDbSelect.mockResolvedValueOnce([
      {
        id: "profile-2",
        username: "aman",
        displayName: "Aman Kreator",
        bio: null,
        avatarUrl: null,
      },
    ]);

    mockDbSelect.mockResolvedValueOnce([]); // no links

    // Even if db query mock improperly returned deliveryUrl:
    mockDbSelect.mockResolvedValueOnce([
      {
        id: "prod-leak-test",
        title: "Template Notion Eksklusif",
        description: "Template produktivitas harian",
        priceIdr: 50000,
        deliveryUrl: leakAttemptUrl,
        position: 0,
      },
    ]);

    const element = await PublicProfilePage({
      params: Promise.resolve({ username: "aman" }),
    });
    const html = renderToStaticMarkup(element);

    // Product details are rendered
    expect(html).toContain("Template Notion Eksklusif");
    expect(html).toContain("Rp 50.000");
    expect(html).toContain("Beli");
    expect(html).toContain("/checkout/prod-leak-test");


    // SECURITY CHECK:
    expect(html).not.toContain(leakAttemptUrl);
    expect(html).not.toContain("secret-download-key-xyz987");
    expect(html).not.toContain("deliveryUrl");
    expect(html).not.toContain("delivery_url");
  });
});
