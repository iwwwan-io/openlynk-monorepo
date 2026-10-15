import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthLayout from "./layout";

const mockGetSession = vi.fn();
const mockRedirect = vi.fn();

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`REDIRECT:${url}`);
  },
}));

vi.mock("@openlynk/auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

describe("AuthLayout (Guest Session Guard for /login and /register)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects authenticated users with valid session to /dashboard", async () => {
    mockGetSession.mockResolvedValueOnce({
      user: {
        id: "user-123",
        name: "Kreator Sukses",
        email: "kreator@openlynk.id",
      },
      session: {
        id: "sess-123",
      },
    });

    await expect(
      AuthLayout({
        children: <div data-testid="login-content">Halaman Login</div>,
      })
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(mockRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("renders auth page children when user is not logged in (session is null)", async () => {
    mockGetSession.mockResolvedValueOnce(null);

    const element = await AuthLayout({
      children: <div data-testid="auth-page">Formulir Masuk / Daftar</div>,
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Formulir Masuk / Daftar");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("renders auth page children when session has no valid user", async () => {
    mockGetSession.mockResolvedValueOnce({});

    const element = await AuthLayout({
      children: <div data-testid="auth-page">Formulir Masuk / Daftar</div>,
    });
    const html = renderToStaticMarkup(element);

    expect(html).toContain("Formulir Masuk / Daftar");
    expect(mockRedirect).not.toHaveBeenCalled();
  });
});
