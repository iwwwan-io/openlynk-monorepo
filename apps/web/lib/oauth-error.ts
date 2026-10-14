/**
 * Memetakan kode error OAuth dari query parameter ?error=
 * ke pesan ramah pengguna dalam bahasa Indonesia.
 */
export function getOAuthErrorMessage(errorCode?: string | null): string | null {
  if (!errorCode) return null;

  switch (errorCode) {
    case "account_not_linked":
      return "Email ini sudah terdaftar dengan metode lain. Masuk dengan email dan kata sandi.";
    default:
      return "Terjadi kesalahan saat masuk dengan akun Google. Silakan coba lagi.";
  }
}
