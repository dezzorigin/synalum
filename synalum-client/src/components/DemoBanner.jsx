import { isDemoMode } from '../utils/api.js'

/**
 * Banner jujur mode demo: tampil di semua halaman bila build memakai
 * VITE_DEMO_MODE=true. Data contoh tersimpan di browser pengunjung —
 * bukan akun sungguhan, dan hilang kalau localStorage dibersihkan.
 */
export default function DemoBanner() {
  if (!isDemoMode) return null
  return (
    <div
      role="status"
      className="border-b-2 px-4 py-2 text-center text-xs font-semibold sm:text-sm"
      style={{ background: '#fdf3d7', borderColor: '#e8a33d', color: '#5c3d05' }}
    >
      Mode demo — tanpa server: akun &amp; peluang tersimpan di browser Anda
      saja, dan peluang berlabel “Contoh” adalah data contoh, bukan lowongan
      asli. Jalankan API lokal untuk data sungguhan (lihat README).
    </div>
  )
}
