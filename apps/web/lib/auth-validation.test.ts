import { describe, expect, it } from "vitest";
import {
  isSessionAuthorized,
  validateEmail,
  validateLoginInput,
  validateName,
  validatePassword,
  validateRegisterInput,
} from "./auth-validation";

describe("auth-validation", () => {
  describe("validateEmail", () => {
    it("rejects empty or non-string email", () => {
      expect(validateEmail("").success).toBe(false);
      expect(validateEmail("   ").success).toBe(false);
      expect(validateEmail(null).success).toBe(false);
      expect(validateEmail(undefined).success).toBe(false);
    });

    it("rejects invalid email formats", () => {
      expect(validateEmail("invalid-email").success).toBe(false);
      expect(validateEmail("user@domain").success).toBe(false);
      expect(validateEmail("@nodomain.com").success).toBe(false);
    });

    it("accepts and normalizes valid email", () => {
      const res = validateEmail("  Budi.Santoso@Example.COM ");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe("budi.santoso@example.com");
      }
    });
  });

  describe("validatePassword", () => {
    it("rejects empty or non-string password", () => {
      expect(validatePassword("").success).toBe(false);
      expect(validatePassword(null).success).toBe(false);
    });

    it("rejects passwords shorter than 8 characters", () => {
      const res = validatePassword("1234567");
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error).toContain("minimal 8 karakter");
      }
    });

    it("accepts valid passwords of at least 8 characters", () => {
      const res = validatePassword("rahasia123");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe("rahasia123");
      }
    });
  });

  describe("validateName", () => {
    it("rejects empty name", () => {
      expect(validateName("").success).toBe(false);
      expect(validateName(" ").success).toBe(false);
    });

    it("rejects single character name", () => {
      expect(validateName("A").success).toBe(false);
    });

    it("accepts valid trimmed name", () => {
      const res = validateName("  Budi Prakoso  ");
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data).toBe("Budi Prakoso");
      }
    });
  });

  describe("validateRegisterInput", () => {
    it("rejects invalid non-object payload", () => {
      expect(validateRegisterInput(null).success).toBe(false);
      expect(validateRegisterInput("not-an-object").success).toBe(false);
    });

    it("validates all fields in registration", () => {
      const invalid = validateRegisterInput({
        name: "A",
        email: "test@example.com",
        password: "password123",
      });
      expect(invalid.success).toBe(false);

      const valid = validateRegisterInput({
        name: "Kreator Indonesia",
        email: "kreator@openlynk.id",
        password: "password123",
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.name).toBe("Kreator Indonesia");
        expect(valid.data.email).toBe("kreator@openlynk.id");
      }
    });
  });

  describe("validateLoginInput", () => {
    it("validates email and password presence", () => {
      expect(validateLoginInput({ email: "invalid", password: "123" }).success).toBe(false);
      expect(validateLoginInput({ email: "user@example.com", password: "" }).success).toBe(false);

      const valid = validateLoginInput({
        email: "user@example.com",
        password: "mysecretpassword",
      });
      expect(valid.success).toBe(true);
    });
  });

  describe("isSessionAuthorized", () => {
    it("returns false for null or undefined session", () => {
      expect(isSessionAuthorized(null)).toBe(false);
      expect(isSessionAuthorized(undefined)).toBe(false);
    });

    it("returns false if user or user.id is missing", () => {
      expect(isSessionAuthorized({ user: null })).toBe(false);
      expect(isSessionAuthorized({ user: { id: "" } })).toBe(false);
      expect(isSessionAuthorized({ user: { id: "123", email: "" } })).toBe(false);
    });

    it("returns true for valid session with user id and email", () => {
      expect(
        isSessionAuthorized({
          user: {
            id: "usr_abc123",
            email: "kreator@openlynk.id",
            name: "Kreator",
          },
        })
      ).toBe(true);
    });
  });
});
