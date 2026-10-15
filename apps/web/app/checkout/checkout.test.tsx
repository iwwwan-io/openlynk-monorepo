import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOrderAction } from "@/app/actions/order";
import CheckoutPage from "./[productId]/page";

const mockNotFound = vi.fn();
const mockDbSelect = vi.fn();
const mockDbInsert = vi.fn();
const mockDbValues = vi.fn();
const mockDbUpdate = vi.fn();
const selectCalls: unknown[] = [];

vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
  useRouter: () => ({
    push: vi.fn(),
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
      insert: () => {
        mockDbInsert();
        return {
          values: (vals: unknown) => {
            mockDbValues(vals);
            return {
              returning: () =>
                Promise.resolve([
                  {
                    id: "order-created-id",
                    ...((vals as object) || {}),
                  },
                ]),
            };
          },
        };
      },
      update: () => {
        mockDbUpdate();
        return {
          set: () => ({
            where: () => Promise.resolve(),
          }),
        };
      },
    }),
    eq: vi.fn((col, val) => ({ col, val })),
    and: vi.fn((...args) => args),
    product: {
      id: "product.id",
      profileId: "product.profileId",
      title: "product.title",
      description: "product.description",
      priceIdr: "product.priceIdr",
      deliveryUrl: "product.deliveryUrl",
      isActive: "product.isActive",
    },
    profile: {
      id: "profile.id",
      username: "profile.username",
      displayName: "profile.displayName",
    },
    order: {
      id: "order.id",
    },
  };
});

describe("CheckoutPage & createOrderAction Security Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    selectCalls.length = 0;
    process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-TESTKEY";
  });

  describe("CheckoutPage Server Component", () => {
    it("calls notFound() if product does not exist or is inactive", async () => {
      mockDbSelect.mockResolvedValueOnce([]); // no active product

      await expect(
        CheckoutPage({ params: Promise.resolve({ productId: "non-existent" }) })
      ).rejects.toThrow("NEXT_NOT_FOUND");

      expect(mockNotFound).toHaveBeenCalled();
    });

    it("renders checkout form with product title and formatted price, without delivery_url", async () => {
      const secretDeliveryUrl = "https://secret-vault.internal/download/super-private.pdf";

      mockDbSelect.mockResolvedValueOnce([
        {
          id: "prod-active-1",
          title: "Template Notion Manajemen Finansial",
          description: "Template produktivitas lengkap untuk mengelola keuangan.",
          priceIdr: 49000,
          creatorUsername: "budi_kreator",
          creatorName: "Budi Prakoso",
          deliveryUrl: secretDeliveryUrl, // Even if mistakenly returned by mock
        },
      ]);

      const element = await CheckoutPage({
        params: Promise.resolve({ productId: "prod-active-1" }),
      });
      const html = renderToStaticMarkup(element);

      // Verify page content
      expect(html).toContain("Template Notion Manajemen Finansial");
      expect(html).toContain("Rp 49.000");
      expect(html).toContain("Budi Prakoso");
      expect(html).toContain("Informasi Pembeli");

      // Verify projection NEVER selected delivery_url
      const checkoutProjection = selectCalls.find(
        (call) => typeof call === "object" && call !== null && "title" in call
      );
      expect(checkoutProjection).toBeDefined();
      if (typeof checkoutProjection === "object" && checkoutProjection !== null) {
        expect(checkoutProjection).not.toHaveProperty("deliveryUrl");
        expect(checkoutProjection).not.toHaveProperty("delivery_url");
      }

      // Verify delivery URL is NEVER present in rendered HTML
      expect(html).not.toContain(secretDeliveryUrl);
      expect(html).not.toContain("super-private.pdf");
    });
  });

  describe("createOrderAction Security & Price Integrity", () => {
    it("strictly uses price and title from database even if browser attempts to manipulate them", async () => {
      // Setup mock product in DB with genuine price Rp 50.000
      mockDbSelect.mockResolvedValueOnce([
        {
          id: "prod-tamper-test",
          title: "Preset Pack Resmi",
          priceIdr: 50000, // Genuine price in DB
          isActive: true,
        },
      ]);

      // Mock fetch to Midtrans Snap API
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "snap-token-xyz123" }),
      });

      // Attacker manipulates FormData to send price Rp 1.000 and fake title
      const formData = new FormData();
      formData.append("product_id", "prod-tamper-test");
      formData.append("buyer_name", "Pembeli Cerdik");
      formData.append("buyer_email", "pembeli@example.com");
      formData.append("price_idr", "1000"); // Manipulated cheap price!
      formData.append("amount_idr", "1000"); // Manipulated cheap price!
      formData.append("product_title", "Hacked Cheap Title"); // Manipulated title!

      const result = await createOrderAction(formData);

      expect(result.success).toBe(true);
      expect(result.snapToken).toBe("snap-token-xyz123");
      expect(result.accessToken).toBeDefined();

      // Check values stored in order table
      expect(mockDbValues).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: "prod-tamper-test",
          buyerName: "Pembeli Cerdik",
          buyerEmail: "pembeli@example.com",
          productTitle: "Preset Pack Resmi", // Title from DB, not manipulated!
          amountIdr: 50000, // Price from DB (50000), not manipulated (1000)!
          status: "pending",
        })
      );

      // Check payload sent to Midtrans Snap API
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/snap/v1/transactions"),
        expect.objectContaining({
          body: expect.stringContaining('"gross_amount":50000'),
        })
      );
    });

    it("rejects order creation if buyer name or email is invalid", async () => {
      const formData = new FormData();
      formData.append("product_id", "prod-1");
      formData.append("buyer_name", "A"); // too short (< 2)
      formData.append("buyer_email", "invalid-email");

      const result = await createOrderAction(formData);
      expect(result.success).toBe(false);
      expect(result.error).toContain("minimal 2 karakter");
      expect(mockDbInsert).not.toHaveBeenCalled();
    });

    it("marks order as failed if Midtrans Snap API call fails", async () => {
      mockDbSelect.mockResolvedValueOnce([
        {
          id: "prod-fail-test",
          title: "Preset Pack",
          priceIdr: 25000,
          isActive: true,
        },
      ]);

      // Midtrans returns 500 Error
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => "Internal Server Error from Midtrans",
      });

      const formData = new FormData();
      formData.append("product_id", "prod-fail-test");
      formData.append("buyer_name", "Pembeli Test");
      formData.append("buyer_email", "pembeli@example.com");

      const result = await createOrderAction(formData);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Gagal memproses pembayaran ke Midtrans");
      expect(mockDbUpdate).toHaveBeenCalled();
    });
  });
});
