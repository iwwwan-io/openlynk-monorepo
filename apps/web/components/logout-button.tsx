"use client";

import { authClient } from "@openlynk/auth/client";

export function LogoutButton() {
  const handleLogout = async () => {
    try {
      await authClient.signOut();
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <button
      onClick={handleLogout}
      type="button"
      className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
    >
      Keluar (Logout)
    </button>
  );
}
