import { describe, expect, it } from "vitest";
import { getOAuthErrorMessage } from "./oauth-error";

describe("getOAuthErrorMessage", () => {
  it("returns null when no error code is provided", () => {
    expect(getOAuthErrorMessage()).toBeNull();
    expect(getOAuthErrorMessage(null)).toBeNull();
    expect(getOAuthErrorMessage("")).toBeNull();
  });

  it("returns specific friendly message for account_not_linked error", () => {
    expect(getOAuthErrorMessage("account_not_linked")).toBe(
      "Email ini sudah terdaftar dengan metode lain. Masuk dengan email dan kata sandi."
    );
  });

  it("returns generic friendly message for other OAuth error codes", () => {
    const genericMessage = "Terjadi kesalahan saat masuk dengan akun Google. Silakan coba lagi.";
    expect(getOAuthErrorMessage("oauth_provider_not_found")).toBe(genericMessage);
    expect(getOAuthErrorMessage("invalid_code")).toBe(genericMessage);
    expect(getOAuthErrorMessage("unable_to_get_user_info")).toBe(genericMessage);
    expect(getOAuthErrorMessage("unknown_error")).toBe(genericMessage);
    expect(getOAuthErrorMessage("access_denied")).toBe(genericMessage);
  });
});
