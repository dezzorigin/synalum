# ARCHITECTURE — Synalum

> Lihat `docs/diagrams.html` untuk diagram visual (arsitektur, alur
> auth, alur lamaran).

## 1. Komponen

```text
┌────────────────────── synalum-client (React 19 + Vite 8, port 5173) ──────┐
│ LandingPage (login) · RegisterRole · AlumniVerification (2 lapis)          │
│ StudentDashboard · AlumniDashboard · LecturerDashboard                      │
│ context/AuthContext.jsx (JWT di localStorage) · utils/api.js (axios)       │
│ utils/demoApi.js (mock API mode demo — hanya bila VITE_DEMO_MODE=true)     │
└───────────────────────────────┬───────────────────────────────────────────┘
                                │ /api (proxy Vite di dev → :5000)
┌───────────────────────────────┴───────────────────────────────────────────┐
│ synalum-api (Express 5, port 5000)                                         │
│ routes/ → controllers/ → db.js (better-sqlite3, WAL, foreign_keys ON)      │
│ middlewares/authMiddleware.js (JWT + RBAC peran)                           │
└────────────────────────────────────────────────────────────────────────────┘
```

## 2. Skema database (SQLite, dibuat otomatis di `db.js`)

| Tabel | Kunci | Isi |
|---|---|---|
| `users` | `id`, `email UNIQUE` | `password_hash` (bcrypt), `role` ∈ mahasiswa/alumni/dosen/admin |
| `alumni_profiles` | `user_id` | angkatan, fakultas, linkedin_url, `status_verifikasi` |
| `student_profiles` | `user_id` | nim, fakultas, prodi, semester, ipk, minat_karir |
| `verifications` | `id` | `user_id`, `otp_code`, `document_url`, `status` ∈ pending/pending_moderator/approved/rejected, `layer_level` ∈ 1/2/3 |
| `opportunities` | `id` | `created_by_user_id`, title, description, `badge_source` ∈ RESMI_USK/EKSTERNAL/ALUMNI_POST, `is_active` |
| `applications` | `id`, `UNIQUE(opportunity_id, student_user_id)` | `student_user_id`, `status` ∈ pending/reviewed/accepted/rejected/withdrawn/submitted |

File DB: `synalum-api/synalum.db` (dibuat otomatis; di-gitignore bersama
`-shm`/`-wal`). Tes memakai `SYNALUM_DB_PATH` ke file sementara.

## 3. Auth & otorisasi

- Register: bcrypt hash (cost 10), password min. 6, role divalidasi
  whitelist. Login: JWT `sub=id, role, email`, 7 hari.
- Secret: `synalum-api/jwtSecret.js` — satu sumber untuk penanda tangan
  (`authController`) dan verifikator (`authMiddleware`). Tanpa
  `JWT_SECRET`, dipakai secret default khusus lokal + peringatan stderr.
- RBAC di `authorizeRoles(...)` per route; kepemilikan dicek di controller
  (pelamar/status hanya untuk pembuat peluang — `created_by_user_id`).

## 4. Mode demo (yang di-deploy ke Pages)

Cloudflare Pages hanya menyajikan file statis — API Express tidak bisa
tinggal di sana. Build Pages memakai `VITE_DEMO_MODE=true`:

- `utils/api.js` memasang `adapter: demoAdapter` pada axios.
- `utils/demoApi.js` mengimplementasikan permukaan REST yang sama
  (method, path, bentuk respons, kode status) di atas localStorage
  (`synalum_demo_v1`): register/login, feed, posting, lamaran, review,
  OTP (selalu `123456`, ditampilkan sebagai simulasi).
- Token demo `demo.<id>` — BUKAN JWT; kata sandi di-hash ringan
  (demo-only). Data bawaan: 3 peluang berlabel "Contoh".
- Banner mode demo tampil di semua halaman; data contoh ber-badge
  "Contoh". Ini BUKAN backend sungguhan dan README mengatakannya.

## 5. Routing client

`HashRouter` (bukan `BrowserRouter`): Pages direct-upload tidak punya
server rewrite, jadi refresh di `/dashboard/...` akan 404 dengan
BrowserRouter. Dengan hash, semua route tinggal di `index.html` yang
sama. Route: `/` (landing+login), `/register`, `/verifikasi-alumni`,
`/dashboard/student`, `/dashboard/alumni`, `/dashboard/dosen`;
yang lain → `/`.

## 6. Showcase statis

`Synalum-showcase/index.html` adalah landing preview statis terpisah
(dulu di Netlify: `synalumpreview.netlify.app`) — BUKAN aplikasi.
Tidak ikut di-deploy ke Pages; disimpan sebagai arsip presentasi.
Aplikasi yang di-deploy adalah `synalum-client`.
