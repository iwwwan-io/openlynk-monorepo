import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  account,
  createDbClient,
  link,
  order,
  product,
  profile,
  session,
  user,
  verification,
} from "./index";

describe("Database schema", () => {
  it("defines standard Better Auth and Openlynk tables with correct table names", () => {
    expect(getTableName(user)).toBe("user");
    expect(getTableName(session)).toBe("session");
    expect(getTableName(account)).toBe("account");
    expect(getTableName(verification)).toBe("verification");
    expect(getTableName(profile)).toBe("profile");
    expect(getTableName(link)).toBe("link");
    expect(getTableName(product)).toBe("product");
    expect(getTableName(order)).toBe("order");
  });


  it("verifies user table structure", () => {
    expect(user.id).toBeDefined();
    expect(user.name).toBeDefined();
    expect(user.email).toBeDefined();
    expect(user.emailVerified).toBeDefined();
    expect(user.image).toBeDefined();
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  it("verifies session table structure", () => {
    expect(session.id).toBeDefined();
    expect(session.userId).toBeDefined();
    expect(session.token).toBeDefined();
    expect(session.expiresAt).toBeDefined();
    expect(session.ipAddress).toBeDefined();
    expect(session.userAgent).toBeDefined();
  });

  it("verifies account table structure", () => {
    expect(account.id).toBeDefined();
    expect(account.userId).toBeDefined();
    expect(account.accountId).toBeDefined();
    expect(account.providerId).toBeDefined();
  });

  it("verifies verification table structure", () => {
    expect(verification.id).toBeDefined();
    expect(verification.identifier).toBeDefined();
    expect(verification.value).toBeDefined();
    expect(verification.expiresAt).toBeDefined();
  });

  it("verifies profile table structure", () => {
    expect(profile.id).toBeDefined();
    expect(profile.userId).toBeDefined();
    expect(profile.username).toBeDefined();
    expect(profile.displayName).toBeDefined();
    expect(profile.bio).toBeDefined();
    expect(profile.avatarUrl).toBeDefined();
    expect(profile.createdAt).toBeDefined();
    expect(profile.updatedAt).toBeDefined();
  });

  it("verifies link table structure", () => {
    expect(link.id).toBeDefined();
    expect(link.profileId).toBeDefined();
    expect(link.title).toBeDefined();
    expect(link.url).toBeDefined();
    expect(link.position).toBeDefined();
    expect(link.isActive).toBeDefined();
    expect(link.createdAt).toBeDefined();
    expect(link.updatedAt).toBeDefined();
  });

  it("verifies product table structure", () => {
    expect(product.id).toBeDefined();
    expect(product.profileId).toBeDefined();
    expect(product.title).toBeDefined();
    expect(product.description).toBeDefined();
    expect(product.priceIdr).toBeDefined();
    expect(product.deliveryUrl).toBeDefined();
    expect(product.position).toBeDefined();
    expect(product.isActive).toBeDefined();
    expect(product.createdAt).toBeDefined();
    expect(product.updatedAt).toBeDefined();
  });

  it("verifies order table structure", () => {
    expect(order.id).toBeDefined();
    expect(order.productId).toBeDefined();
    expect(order.buyerName).toBeDefined();
    expect(order.buyerEmail).toBeDefined();
    expect(order.productTitle).toBeDefined();
    expect(order.amountIdr).toBeDefined();
    expect(order.status).toBeDefined();
    expect(order.midtransOrderId).toBeDefined();
    expect(order.accessToken).toBeDefined();
    expect(order.paidAt).toBeDefined();
    expect(order.createdAt).toBeDefined();
    expect(order.updatedAt).toBeDefined();
  });

  it("exports createDbClient factory function and accepts options", () => {

    expect(typeof createDbClient).toBe("function");
    const testClient = createDbClient("postgresql://postgres:postgres@localhost:5432/test", {
      prepare: false,
    });
    expect(testClient).toBeDefined();
  });
});
