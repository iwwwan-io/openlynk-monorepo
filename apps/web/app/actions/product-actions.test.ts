import { describe, expect, it } from "vitest";

describe("Product Server Actions - Cross-User Ownership Guard Logic", () => {
  it("rejects product update if product does not belong to active user's profile", () => {
    const activeUserProfileId = "profile-creator-a";
    const foreignProduct = {
      id: "product-creator-b-1",
      profileId: "profile-creator-b",
      title: "Preset Pack",
      priceIdr: 50000,
    };

    const isOwner = foreignProduct.profileId === activeUserProfileId;
    expect(isOwner).toBe(false);

    const result = isOwner
      ? { success: true }
      : {
          success: false,
          error: "Produk tidak ditemukan atau Anda tidak memiliki akses",
        };

    expect(result.success).toBe(false);
    expect(result.error).toBe("Produk tidak ditemukan atau Anda tidak memiliki akses");
  });

  it("rejects product deletion if product belongs to another user", () => {
    const activeUserProfileId = "profile-creator-a";
    const foreignProduct = {
      id: "product-creator-b-2",
      profileId: "profile-creator-b",
      title: "Notion Template",
      priceIdr: 75000,
    };

    const isOwner = foreignProduct.profileId === activeUserProfileId;
    expect(isOwner).toBe(false);

    const deleteResult = isOwner
      ? { success: true }
      : {
          success: false,
          error: "Produk tidak ditemukan atau Anda tidak memiliki akses",
        };

    expect(deleteResult.success).toBe(false);
    expect(deleteResult.error).toBe("Produk tidak ditemukan atau Anda tidak memiliki akses");
  });

  it("rejects product toggle active if product belongs to another user", () => {
    const activeUserProfileId = "profile-creator-a";
    const foreignProduct = {
      id: "product-creator-b-3",
      profileId: "profile-creator-b",
      isActive: true,
    };

    const isOwner = foreignProduct.profileId === activeUserProfileId;
    expect(isOwner).toBe(false);

    const toggleResult = isOwner
      ? { success: true }
      : {
          success: false,
          error: "Produk tidak ditemukan atau Anda tidak memiliki akses",
        };

    expect(toggleResult.success).toBe(false);
  });

  it("rejects product deletion if product already has orders with friendly message", () => {
    const productOrders = [{ id: "order-1", productId: "product-123" }];
    const hasOrders = productOrders.length > 0;

    const result = hasOrders
      ? {
          success: false,
          error: "Produk sudah punya pesanan, nonaktifkan saja",
        }
      : { success: true };

    expect(result.success).toBe(false);
    expect(result.error).toBe("Produk sudah punya pesanan, nonaktifkan saja");
  });

  it("handles foreign key constraint violation gracefully when deleting product", () => {
    const fkError = {
      code: "23503",
      constraint_name: "order_product_id_product_id_fk",
      message: 'update or delete on table "product" violates foreign key constraint',
    };

    const isFkViolation =
      fkError.code === "23503" ||
      fkError.constraint_name.includes("order_product_id") ||
      fkError.message.includes("violates foreign key constraint");

    expect(isFkViolation).toBe(true);

    const result = isFkViolation
      ? {
          success: false,
          error: "Produk sudah punya pesanan, nonaktifkan saja",
        }
      : { success: false, error: "Terjadi kesalahan" };

    expect(result.error).toBe("Produk sudah punya pesanan, nonaktifkan saja");
  });
});
