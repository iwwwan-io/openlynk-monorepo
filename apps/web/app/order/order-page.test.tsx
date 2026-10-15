import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OrderPage, { generateMetadata } from "./[accessToken]/page";

const mockNotFound = vi.fn();
const mockDbSelect = vi.fn();
const selectCalls: unknown[] = [];

vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({
    refresh: vi.fn(),
  }),
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
          innerJoin: () => queryObj,
          where: () => queryObj,
          limit: () => queryObj,
        };
        return queryObj;
      },
    }),
    eq: vi.fn((col, val) => ({ col, val })),
    order: {
      id: "order.id",
      productId: "order.productId",
      productTitle: "order.productTitle",
      amountIdr: "order.amountIdr",
      status: "order.status",
      buyerName: "order.buyerName",
      buyerEmail: "order.buyerEmail",
      paidAt: "order.paidAt",
      createdAt: "order.createdAt",
      accessToken: "order.accessToken",
    },
    product: {
      id: "product.id",
      profileId: "product.profileId",
      deliveryUrl: "product.deliveryUrl",
    },
    profile: {
      id: "profile.id",
      username: "profile.username",
      displayName: "profile.displayName",
    },
  };
});

describe("OrderPage (/order/[accessToken]) & delivery_url Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCalls.length = 0;
  });

  it("calls notFound() if access_token does not exist in database", async () => {
    mockDbSelect.mockResolvedValueOnce([]); // order not found

    await expect(
      OrderPage({ params: Promise.resolve({ accessToken: "invalid-token" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalled();
  });

  it("renders pending state with refresh button and STRICTLY DOES NOT query or leak delivery_url", async () => {
    const secretUrl = "https://secret-vault.internal/download/ebook-secret.pdf";

    // 1. Order query (status pending)
    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-pending-1",
        productId: "prod-1",
        productTitle: "Ebook Panduan Belajar Next.js",
        amountIdr: 25000,
        status: "pending",
        buyerName: "Andi",
        buyerEmail: "andi@example.com",
        paidAt: null,
      },
    ]);

    // 2. Creator profile query
    mockDbSelect.mockResolvedValueOnce([
      {
        username: "budikreator",
        displayName: "Budi Prakoso",
      },
    ]);

    const element = await OrderPage({
      params: Promise.resolve({ accessToken: "token-pending-123" }),
    });
    const html = renderToStaticMarkup(element);

    // Verify Pending UI
    expect(html).toContain("Menunggu Pembayaran");
    expect(html).toContain("Ebook Panduan Belajar Next.js");
    expect(html).toContain("Rp 25.000");
    expect(html).toContain("Muat Ulang Status");

    // CRITICAL SECURITY ASSERTION:
    // delivery_url must NEVER be queried in DB when status is pending!
    const deliveryProjection = selectCalls.find(
      (call) => typeof call === "object" && call !== null && "deliveryUrl" in call
    );
    expect(deliveryProjection).toBeUndefined();

    // delivery_url must NEVER appear in HTML
    expect(html).not.toContain("deliveryUrl");
    expect(html).not.toContain("delivery_url");
    expect(html).not.toContain(secretUrl);
  });

  it("renders paid state with delivery_url button and mandatory warning message", async () => {
    const secretUrl = "https://drive.google.com/file/d/access-key-paid-123/view";

    // 1. Order query (status paid)
    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-paid-1",
        productId: "prod-1",
        productTitle: "Ebook Panduan Belajar Next.js",
        amountIdr: 25000,
        status: "paid",
        buyerName: "Budi Pembeli",
        buyerEmail: "pembeli@example.com",
        paidAt: new Date(),
      },
    ]);

    // 2. Creator profile query
    mockDbSelect.mockResolvedValueOnce([
      {
        username: "budikreator",
        displayName: "Budi Prakoso",
      },
    ]);

    // 3. Product secret delivery_url query (only executed when status === 'paid')
    mockDbSelect.mockResolvedValueOnce([
      {
        deliveryUrl: secretUrl,
      },
    ]);

    const element = await OrderPage({
      params: Promise.resolve({ accessToken: "token-paid-456" }),
    });
    const html = renderToStaticMarkup(element);

    // Verify Paid UI
    expect(html).toContain("Pembayaran Berhasil");
    expect(html).toContain("Terima Kasih, Budi Pembeli!");
    expect(html).toContain("Ebook Panduan Belajar Next.js");

    // Verify Mandatory Warning Alert
    expect(html).toContain("Simpan link halaman ini. Kami belum mengirim email.");

    // Verify deliveryUrl button / link is rendered with secure attributes
    expect(html).toContain("Akses Produk Digital Anda");
    expect(html).toContain(secretUrl);
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain(`href="${secretUrl}"`);

    // Verify deliveryUrl query was indeed executed for paid status
    const deliveryProjection = selectCalls.find(
      (call) => typeof call === "object" && call !== null && "deliveryUrl" in call
    );
    expect(deliveryProjection).toBeDefined();
  });

  it("exports metadata with referrer set to 'no-referrer' and robots noindex", async () => {
    const meta = await generateMetadata();
    expect(meta.referrer).toBe("no-referrer");
    expect(meta.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("renders expired state with link back to creator profile and without delivery_url", async () => {
    // 1. Order query (status expired)
    mockDbSelect.mockResolvedValueOnce([
      {
        id: "order-expired-1",
        productId: "prod-1",
        productTitle: "Preset Lightroom",
        amountIdr: 50000,
        status: "expired",
        buyerName: "Siti",
        buyerEmail: "siti@example.com",
        paidAt: null,
      },
    ]);

    // 2. Creator profile query
    mockDbSelect.mockResolvedValueOnce([
      {
        username: "fotografer_pro",
        displayName: "Fotografer Pro",
      },
    ]);

    const element = await OrderPage({
      params: Promise.resolve({ accessToken: "token-expired-789" }),
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Waktu Pembayaran Habis");
    expect(html).toContain("Kembali ke Halaman Profil Fotografer Pro");
    expect(html).toContain("/fotografer_pro");

    // delivery_url must NOT be queried
    const deliveryProjection = selectCalls.find(
      (call) => typeof call === "object" && call !== null && "deliveryUrl" in call
    );
    expect(deliveryProjection).toBeUndefined();
  });
});
