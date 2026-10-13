/**
 * Utilitas untuk mendeteksi error database PostgreSQL (Layerbase).
 */

/**
 * Mendeteksi error pelanggaran keunikan database PostgreSQL (kode 23505)
 * untuk menangani kondisi balapan konkurensi (race condition) secara elegan.
 */
export function handleDatabaseUniqueError(err: unknown): string | null {
  if (typeof err === "object" && err !== null) {
    const errorObj = err as { code?: string; message?: string; constraint_name?: string };
    const code = errorObj.code;
    const msg = String(errorObj.message || "");
    const constraint = String(errorObj.constraint_name || "");

    if (
      code === "23505" ||
      msg.includes("unique constraint") ||
      msg.includes("duplicate key value")
    ) {
      if (
        constraint.includes("username") ||
        msg.includes("profile_username_unique") ||
        msg.includes("username")
      ) {
        return "Username sudah digunakan, silakan pilih username lain";
      }
      if (
        constraint.includes("user_id") ||
        msg.includes("profile_user_id_unique") ||
        msg.includes("user_id")
      ) {
        return "Anda sudah memiliki profil";
      }
      return "Data yang dimasukkan sudah terdaftar";
    }
  }
  return null;
}
