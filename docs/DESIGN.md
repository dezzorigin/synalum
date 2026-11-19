# DESIGN.md — Kontrak Arah Desain SYNALUM

> Ditulis SEBELUM coding (standar `ui-anti-slop.md`). Berlaku untuk UI produk
> di `synalum-client/` — landing + register + verifikasi + 3 dashboard.
> Bukan landing SaaS baru: produknya tetap aplikasi yang sama (login peran,
> posting peluang, lamaran, verifikasi alumni), hanya bahasanya yang dirapikan.

## Referensi (riset dulu, baru bangun)

Kebutuhan: platform kampus yang menghubungkan alumni–mahasiswa–dosen USK
untuk magang, mentorship, dan riset. Pengguna: mahasiswa yang melamar,
alumni/dosen yang memposting peluang dan mereview pelamar. Harus terasa
seperti papan pengumuman kampus yang tertib — bukan SaaS generik.

Kandidat (nyata, dikunjungi 19 Nov 2026):

1. **UNISR — alumni community platform, Università Vita-Salute San Raffaele**
   — <https://dariozanna.com/work/unisr/> — direktori alumni sebagai jantung
   pengalaman, mentorship sebagai alasan terhubung, job board, badge
   kontribusi (mentor, 10+ tahun, kontributor). Cocok: peluang ditampilkan
   sebagai **daftar/baris** yang bisa dipindai, bukan kartu-kartu simetris;
   badge menandai siapa berkontribusi apa.
2. **UC Davis GSM Alumni Platform** — <https://www.yingwliu.com/work/uc-davis-gsm>
   — satu tempat alumni belajar & terhubung; direktori sederhana + filter,
   alur login → discovery → simpan. Cocok: satu aksi utama per layar,
   navigasi yang tidak mengajak jalan-jalan.
3. **EduSpace — Alumni Module (Framer)** —
   <https://sharafa.framer.website/projects/eduspace> — direktori opt-in,
   job board, mentorship berbasis skill. Cocok: pemisahan peran yang tegas.
   Tidak dipilih: terlalu modul-enterprise, bukan rasa kampus.

**Pemenang: UNISR.** Yang di-clone plek-ketiplek strukturnya: daftar peluang
sebagai baris ledger bernomor + badge sumber (RESMI USK / ALUMNI /
EKSTERNAL), profil peran sebagai "kartu anggota", dan verifikasi sebagai
cap/stempel. Yang diubah: palet (dari netral kampus Eropa → kertas + teal
USK + kunyit), tipografi (serif akademik untuk judul), dan detail khas
(cap verifikasi bundar + garis aturan tebal).

## Palet (5 warna bernama, tiap warna punya tugas)

| Nama | Hex | Peran |
|---|---|---|
| Kertas | `#F6F4EE` | Latar utama — kertas pengumuman, bukan putih klinik |
| Tinta | `#1F2A28` | Teks utama, heading, garis aturan |
| Teal USK | `#0B5E66` | Aksi utama, link, identitas kampus (dari brand repo) |
| Kunyit | `#E8A33D` | Penanda/pesorotan: badge, garis bawah judul, angka ledger |
| Merah Cap | `#B3402E` | Cap/stempel verifikasi + error — dipakai hemat, hanya untuk "resmi" |

Tidak ada gradient (ungu/biru maupun teal→oranye) di mana pun. Tidak ada satu
hue doang: teal (aksi), kunyit (sorot), merah cap (stempel) masing-masing
punya tugas berbeda. Latar bukan krim+terracotta dan bukan near-black+lime.

## Tipografi (2 keluarga)

- **Display: Fraunces** (serif, 600–700) — judul halaman & headline. Rasa
  akademik/kampus, bukan grotesk SaaS.
- **Body: Public Sans** (400–700) — semua teks UI, label, isi kartu.
- Angka ledger (nomor baris, jumlah peluang, tanggal) memakai tumpukan
  `ui-monospace` sistem dengan `font-variant-numeric: tabular-nums` — bukan
  keluarga font ketiga yang di-load.

Dilarang: Inter/Roboto/system untuk semuanya (Inter dihapus dari
`index.html` dan `index.css`).

## Layout (satu kalimat + satu detail khas)

**Layout:** "Buku besar kampus" — header bergaris aturan tebal 3px,
kolom kiri narasi + kolom kanan kartu anggota (login), dan di bawahnya
peluang tampil sebagai **baris-baris ledger bernomor**, bukan grid kartu.

**Detail khas:** cap verifikasi bundar (border ganda, teks melingkar
"TERVERIFIK · USK ·") yang dicap miring di kartu anggota + nomor baris
mono di setiap peluang. Tes siluet: thumbnail hitam-putih masih terbaca
sebagai "papan pengumuman + kartu anggota", bukan landing SaaS mana pun.

## Geometri & motion

- Radius: kartu 10px, input/tombol 6px (kecil-tegas, bukan 24–40px).
- Padding kartu ≥16px, grid 4/8pt, radius dalam = radius luar − padding.
- Motion: transisi ≤150ms ease-out; hover hanya naik 1px + bayangan tipis;
  aksi yang diulang 100x/hari (Lamar, Terima/Tolak) = 0ms animasi masuk,
  hanya perubahan status. `prefers-reduced-motion` dihormati (animasi mati).
- Ikon: SVG inline satu bobot (stroke 1.5px), bukan emoji mentah.
  Emoji dihapus dari semua label fungsi (👥 🎓 ✅ 🤝 💼 🔬 🙈 👁️ ⚠️ 💡).

## Beda dari repo sebelumnya (#53 happy-birthday-mama)

| Sumbu | #53 | Synalum (ini) |
|---|---|---|
| Palet | Mawar/merah muda + krem | Kertas + teal USK + kunyit + merah cap |
| Tipografi | Cormorant + Karla | Fraunces + Public Sans |
| Layout | Satu adegan penuh layar | Buku besar: header garis + 2 kolom + ledger |
| Radius/spacing | 24–40px, lega | 10px/6px, rapat-tertib |
| Detail khas | Fireworks + slideshow foto | Cap verifikasi bundar + nomor baris mono |

Beda 5 dari 5 sumbu.

## Kejujuran data (bagian dari desain)

- Statistik vanity dihapus: "12K+ Alumni Aktif", "450 Co-Mentors", "98%
  Verified" tidak punya sumber — diganti alur 3 langkah yang memang ada
  (Daftar peran → Verifikasi alumni → Lamar/posting peluang).
- "Skor Relevansi 82", "Mahasiswa A/B", dan daftar dummy "Info Magang/Riset"
  dihapus — diganti angka nyata dari API (jumlah peluang, jumlah pelamar).
- Data contoh di mode demo dilabeli **"Contoh"** dan banner mode demo
  selalu tampil; bukan data asli yang disamarkan.
