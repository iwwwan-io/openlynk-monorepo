import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { account, createDbClient, session, user, verification } from "./index";

describe("Database schema", () => {
  it("defines standard Better Auth tables with correct table names", () => {
    expect(getTableName(user)).toBe("user");
    expect(getTableName(session)).toBe("session");
    expect(getTableName(account)).toBe("account");
    expect(getTableName(verification)).toBe("verification");
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

  it("exports createDbClient factory function", () => {
    expect(typeof createDbClient).toBe("function");
  });
});
