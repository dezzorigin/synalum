/**
 * Satu sumber kebenaran untuk JWT secret.
 *
 * BUG YANG DIPERBAIKI (audit 19 Nov 2026): sebelumnya `authController.js`
 * memakai secret default `dev-only-...` saat JWT_SECRET tidak diset,
 * sementara `authMiddleware.js` mengembalikan 500 kalau JWT_SECRET tidak
 * ada. Akibatnya login BERHASIL (token terbit) tapi SEMUA endpoint
 * terautentikasi gagal 500 — aplikasi tidak bisa dipakai tanpa .env.
 *
 * Sekarang kedua sisi memakai fungsi ini. Secret default HANYA untuk
 * pengembangan lokal dan SELALU disertai peringatan di stderr; di
 * produksi JWT_SECRET wajib diset (lihat .env.example).
 */
const DEV_ONLY_SECRET = 'dev-only-synalum-secret-change-me'

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET
  if (secret && secret.trim()) return secret.trim()
  console.warn(
    '[synalum] PERINGATAN: JWT_SECRET tidak diset — memakai secret default ' +
      'KHUSUS PENGEMBANGAN LOKAL. Jangan pakai mode ini di server publik.',
  )
  return DEV_ONLY_SECRET
}
