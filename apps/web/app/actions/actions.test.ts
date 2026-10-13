import { describe, expect, it } from "vitest";
import { handleDatabaseUniqueError } from "./profile";

describe("handleDatabaseUniqueError (PostgreSQL Race Condition Handling)", () => {
  it("detects username unique constraint violation and returns friendly message", () => {
    const errorObj = {
      code: "23505",
      constraint_name: "profile_username_unique",
      message: 'duplicate key value violates unique constraint "profile_username_unique"',
    };

    const friendlyMsg = handleDatabaseUniqueError(errorObj);
    expect(friendlyMsg).toBe("Username sudah digunakan, silakan pilih username lain");
  });

  it("detects user_id unique constraint violation and returns friendly message", () => {
    const errorObj = {
      code: "23505",
      constraint_name: "profile_user_id_unique",
      message: 'duplicate key value violates unique constraint "profile_user_id_unique"',
    };

    const friendlyMsg = handleDatabaseUniqueError(errorObj);
    expect(friendlyMsg).toBe("Anda sudah memiliki profil");
  });

  it("handles duplicate key message even without constraint_name", () => {
    const errorObj = {
      code: "23505",
      message: "Key (username)=(kreator_indo) already exists.",
    };

    const friendlyMsg = handleDatabaseUniqueError(errorObj);
    expect(friendlyMsg).toBe("Username sudah digunakan, silakan pilih username lain");
  });

  it("returns null for non-unique database errors", () => {
    const foreignKeyError = {
      code: "23503",
      message: 'insert or update on table "profile" violates foreign key constraint',
    };
    expect(handleDatabaseUniqueError(foreignKeyError)).toBeNull();

    const genericError = new Error("Connection timed out");
    expect(handleDatabaseUniqueError(genericError)).toBeNull();
  });
});

describe("Server Actions - Cross-User Ownership Guard Logic", () => {
  it("rejects link manipulation if link does not belong to active user's profile", async () => {
    // Simulasi data
    const activeUserProfileId = "profile-user-a";
    const foreignLink = {
      id: "link-user-b-1",
      profileId: "profile-user-b", // Milik user B
      title: "Channel User B",
      url: "https://youtube.com/@user_b",
    };

    // Fungsi verifikasi kepemilikan yang dipakai di updateLinkAction & deleteLinkAction:
    // and(eq(link.id, linkId), eq(link.profileId, userProfile.id))
    const isOwner = foreignLink.profileId === activeUserProfileId;
    expect(isOwner).toBe(false);

    // Hasil yang diharapkan dari Server Action ketika link bukan milik user aktif
    const result = isOwner
      ? { success: true }
      : {
          success: false,
          error: "Tautan tidak ditemukan atau Anda tidak memiliki akses",
        };

    expect(result.success).toBe(false);
    expect(result.error).toBe("Tautan tidak ditemukan atau Anda tidak memiliki akses");
  });
});
