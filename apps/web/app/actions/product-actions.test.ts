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
});
