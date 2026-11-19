# PRD — Synalum (Synergy Alumni & Mahasiswa)

> Produk: platform kolaborasi karier Universitas Syiah Kuala (USK).
> Status dokumen: PRD hasil audit 19 Nov 2026 — hanya berisi fitur yang
> BENAR-BENAR ADA di repo. Fitur rencana dicatat di §6, bukan dijual
> sebagai fitur jalan.

## 1. Masalah

Lulusan USK dan mahasiswa aktif terputus: alumni yang bisa memberi
magang/mentorship tidak punya satu tempat untuk menawarkannya, mahasiswa
tidak tahu peluang mana yang resmi dari kampus dan mana yang dari luar,
dan dosen tidak punya jalur rapi untuk membuka asisten riset lalu
mereview pelamarnya.

## 2. Pengguna & peran

| Peran | Bisa | Tidak bisa |
|---|---|---|
| Mahasiswa | Daftar, login, melihat feed peluang, melamar (1x per peluang) | Memposting peluang, melihat pelamar |
| Alumni | Daftar, login, verifikasi 2 lapis, memposting peluang (badge ALUMNI_POST), melihat pelamar peluangnya, terima/tolak lamaran | Melihat pelamar peluang orang lain |
| Dosen / Admin | Seperti alumni, tapi postingannya ber-badge RESMI_USK | Melihat pelamar peluang orang lain |
| Belum login | Melihat landing + login | Semua yang butuh token |

## 3. Fitur (yang jalan — teruji `synalum-api/test/api.test.js` + e2e)

1. **Register & login** — email + password (min. 6 karakter, bcrypt),
   JWT 7 hari, role di token. Email duplikat → 409.
2. **Feed peluang** — `GET /api/opportunities/all`, hanya yang aktif,
   terbaru dulu, badge sumber dari peran pembuat (RESMI_USK / ALUMNI_POST /
   EKSTERNAL).
3. **Posting peluang** — alumni/dosen/admin; judul wajib; badge diisi
   server dari peran (bukan dari input client).
4. **Lamaran** — mahasiswa melamar 1x per peluang (UNIQUE di DB →
   duplikat 409); pelamar hanya terlihat pemilik peluang.
5. **Review pelamar** — pemilik peluang melihat daftar pelamar (email +
   status) lalu mengubah status `accepted`/`rejected` (hanya dua itu).
6. **Verifikasi alumni 2 lapis** — lapis 1: OTP email; lapis 2: tautan
   LinkedIn/URL ijazah → status `pending_moderator`. Dashboard alumni
   terkunci sampai lapis 2 dikirim (gate lokal di client, lihat §5).
7. **Mode demo** — build Pages memakai mock API di browser (lihat
   `docs/ARCHITECTURE.md`): alur 1–6 bisa dicoba tanpa server, dengan
   data contoh berlabel "Contoh".

## 4. Bukan fitur (jangan diklaim)

- **Tidak ada pengiriman email sungguhan.** OTP adalah simulasi: di
  mode demo kodenya ditampilkan di layar; di API lokal kodenya
  dikembalikan hanya bila `SYNALUM_OTP_DEMO=1` (default). Produksi wajib
  `SYNALUM_OTP_DEMO=0` + layanan email (belum ada).
- **Tidak ada moderasi sungguhan.** Dokumen lapis 2 berstatus
  `pending_moderator` — tidak ada antarmuka moderator yang menyetujui /
  menolaknya. Client membuka dashboard alumni setelah dokumen dikirim
  (keputusan MVP, bukan persetujuan).
- **Tidak ada pencocokan/mentor-matching, skor relevansi, chat, atau
  notifikasi.** "Skor Relevansi 82" di dashboard lama adalah angka dummy
  dan sudah dihapus.
- **Tidak ada upload file.** Verifikasi memakai URL, bukan unggahan.

## 5. Keterbatasan yang diketahui (jujur)

1. JWT secret default hanya untuk pengembangan lokal (`jwtSecret.js` —
   ada peringatan di stderr). Di server bersama, `JWT_SECRET` wajib
   diset; kalau tidak, token dari instalasi berbeda bisa saling cocok.
2. Alumni "terverifikasi" di client disimpan di localStorage
   (`synalum_alumni_verified`) — bisa diubah dari DevTools. Ini gate UX,
   bukan otorisasi server: endpoint sensitif tetap dicek JWT + peran di
   server, tapi status verifikasi alumni belum ditegakkan server-side.
3. API hanya mendengarkan lokal; CORS hanya mengizinkan
   `localhost:5173/4173`. Deploy backend (Docker + Coolify) menunggu
   keputusan Nabil — lihat `docs/DEPLOY.md`.
4. Verifikasi lapis 3 (konfirmasi sesama alumni) belum ada: tidak ada
   endpoint, tidak ada UI (langkah ke-3 yang dulu tampil di UI sudah
   dihapus karena inputnya mati).

## 6. Rencana (bukan janji)

- Lapis 3 verifikasi alumni (endpoint + UI + status moderator).
- Endpoint `GET /api/opportunities/mine` (saat ini client memfilter
  "peluang saya" dari feed penuh — boros tapi benar untuk MVP).
- Moderasi dokumen oleh admin (setujui/tolak + status alumni di server).
- Pengiriman OTP via email sungguhan + `SYNALUM_OTP_DEMO=0` sebagai
  default produksi.
- Deploy API via Docker + Coolify (menunggu keputusan Nabil).

## 7. Audit 19 Nov 2026 — temuan & perbaikan

| # | Temuan | Perbaikan |
|---|---|---|
| A1 | JWT secret tidak cocok: login terbit token, semua endpoint auth 500 tanpa `.env` | `jwtSecret.js` dipakai controller + middleware |
| A2 | OTP dibandingkan di frontend (bisa dilewati) | `POST /api/verify/confirm-otp` server-side; OTP tidak dipakai ulang |
| A3 | Statistik landing "12K+ / 450 / 98%" tanpa sumber | Dihapus; diganti alur 3 langkah yang memang ada |
| A4 | "Skor Relevansi 82" dummy | Dihapus; diganti jumlah peluang nyata dari API |
| A5 | Daftar hardcode "Mentorship Backend / Internship Fullstack", "Mahasiswa A/B", "Asisten Riset AI / Magang Kampus Merdeka" | Dihapus; diganti data nyata dari API |
| A6 | Placeholder "Minimal 8 karakter" vs backend min. 6 | Disamakan ke 6 + `minLength=6` |
| A7 | `alert()` untuk hasil lamaran | Notice inline + tombol "Lamaran Terkirim" |
| A8 | Langkah verifikasi ke-3: input tanpa state, tombol "Selesai" mati | Langkah dihapus; lapis 3 dicatat sebagai rencana |
| A9 | `synalum.db-shm` + `synalum.db-wal` ter-commit | Dihapus dari tree; `.gitignore` diperkuat |
| A10 | Landing: gradient, Inter, emoji ikon, 3 kartu simetris | Desain ulang per `docs/DESIGN.md` |
