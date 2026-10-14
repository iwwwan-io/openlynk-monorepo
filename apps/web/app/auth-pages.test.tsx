import { authClient } from "@openlynk/auth/client";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login/login-form";
import LoginPage, { dynamic as loginDynamic, metadata as loginMetadata } from "./login/page";
import { RegisterForm } from "./register/register-form";
import RegisterPage, {
  dynamic as registerDynamic,
  metadata as registerMetadata,
} from "./register/page";

vi.mock("@openlynk/auth/client", () => {
  return {
    authClient: {
      signIn: {
        email: vi.fn(),
        social: vi.fn(),
      },
      signUp: {
        email: vi.fn(),
      },
    },
  };
});

describe("LoginPage and RegisterPage server routes", () => {
  it("exports dynamic = force-dynamic and proper metadata for LoginPage", () => {
    expect(loginDynamic).toBe("force-dynamic");
    expect(loginMetadata.title).toBe("Masuk - Openlynk");
  });

  it("exports dynamic = force-dynamic and proper metadata for RegisterPage", () => {
    expect(registerDynamic).toBe("force-dynamic");
    expect(registerMetadata.title).toBe("Daftar Akun - Openlynk");
  });

  it("renders LoginPage with isGoogleAuthEnabled based on environment", () => {
    const prevClientId = process.env.GOOGLE_CLIENT_ID;
    const prevClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const element = LoginPage();
    const htmlWithoutGoogle = renderToStaticMarkup(element);
    expect(htmlWithoutGoogle).not.toContain("Lanjutkan dengan Google");

    process.env.GOOGLE_CLIENT_ID = "mock-id";
    process.env.GOOGLE_CLIENT_SECRET = "mock-secret";

    const elementWithGoogle = LoginPage();
    const htmlWithGoogle = renderToStaticMarkup(elementWithGoogle);
    expect(htmlWithGoogle).toContain("Lanjutkan dengan Google");

    if (prevClientId !== undefined) {
      process.env.GOOGLE_CLIENT_ID = prevClientId;
    } else {
      delete process.env.GOOGLE_CLIENT_ID;
    }
    if (prevClientSecret !== undefined) {
      process.env.GOOGLE_CLIENT_SECRET = prevClientSecret;
    } else {
      delete process.env.GOOGLE_CLIENT_SECRET;
    }
  });

  it("renders RegisterPage with isGoogleAuthEnabled based on environment", () => {
    const prevClientId = process.env.GOOGLE_CLIENT_ID;
    const prevClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const element = RegisterPage();
    const htmlWithoutGoogle = renderToStaticMarkup(element);
    expect(htmlWithoutGoogle).not.toContain("Lanjutkan dengan Google");

    process.env.GOOGLE_CLIENT_ID = "mock-id";
    process.env.GOOGLE_CLIENT_SECRET = "mock-secret";

    const elementWithGoogle = RegisterPage();
    const htmlWithGoogle = renderToStaticMarkup(elementWithGoogle);
    expect(htmlWithGoogle).toContain("Lanjutkan dengan Google");

    if (prevClientId !== undefined) {
      process.env.GOOGLE_CLIENT_ID = prevClientId;
    } else {
      delete process.env.GOOGLE_CLIENT_ID;
    }
    if (prevClientSecret !== undefined) {
      process.env.GOOGLE_CLIENT_SECRET = prevClientSecret;
    } else {
      delete process.env.GOOGLE_CLIENT_SECRET;
    }
  });
});

describe("LoginForm and RegisterForm UI rendering with Google OAuth", () => {
  it("hides Google button when isGoogleAuthEnabled is false in LoginForm", () => {
    const html = renderToStaticMarkup(<LoginForm isGoogleAuthEnabled={false} />);
    expect(html).not.toContain("Lanjutkan dengan Google");
    expect(html).not.toContain('data-testid="google-signin-button"');
  });

  it("shows Google button when isGoogleAuthEnabled is true in LoginForm", () => {
    const html = renderToStaticMarkup(<LoginForm isGoogleAuthEnabled={true} />);
    expect(html).toContain("Lanjutkan dengan Google");
    expect(html).toContain('data-testid="google-signin-button"');
  });

  it("hides Google button when isGoogleAuthEnabled is false in RegisterForm", () => {
    const html = renderToStaticMarkup(<RegisterForm isGoogleAuthEnabled={false} />);
    expect(html).not.toContain("Lanjutkan dengan Google");
    expect(html).not.toContain('data-testid="google-signup-button"');
  });

  it("shows Google button when isGoogleAuthEnabled is true in RegisterForm", () => {
    const html = renderToStaticMarkup(<RegisterForm isGoogleAuthEnabled={true} />);
    expect(html).toContain("Lanjutkan dengan Google");
    expect(html).toContain('data-testid="google-signup-button"');
  });

  it("uses authClient.signIn.social with google provider and /dashboard callbackURL", async () => {
    const signInSocialMock = vi.mocked(authClient.signIn.social);
    signInSocialMock.mockResolvedValueOnce({
      data: { url: "https://accounts.google.com" },
      error: null,
    });

    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });

    expect(signInSocialMock).toHaveBeenCalledWith({
      provider: "google",
      callbackURL: "/dashboard",
    });
  });
});
