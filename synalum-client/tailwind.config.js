// Catatan: Tailwind v4 membaca token dari @theme di src/index.css —
// file ini dipertahankan sebagai dokumentasi palet (dan dipakai tooling
// lama). Jangan tambah warna/font di sini tanpa mengubah index.css.
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: '#F6F4EE', // Kertas — latar utama (docs/DESIGN.md)
        ink: '#1F2A28', // Tinta — teks utama
        primary: '#0B5E66', // Teal USK — aksi utama
        accent: '#E8A33D', // Kunyit — penanda / badge
        cap: '#B3402E', // Merah Cap — stempel + error
        background: '#F6F4EE',
        text: '#1F2A28',
      },
      fontFamily: {
        sans: ['Public Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
