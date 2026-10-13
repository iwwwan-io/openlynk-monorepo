import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { account, createDbClient, link, profile, session, user, verification } from "./index";

describe("Database schema", () => {
  it("defines standard Better Auth and Openlynk tables with correct table names", () => {
    expect(getTableName(user)).toBe("user");
    expect(getTableName(session)).toBe("session");
    expect(getTableName(account)).toBe("account");
    expect(getTableName(verification)).toBe("verification");
    expect(getTableName(profile)).toBe("profile");
    expect(getTableName(link)).toBe("link");
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

  it("exports createDbClient factory function", () => {
    expect(typeof createDbClient).toBe("function");
  });
});
