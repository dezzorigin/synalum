# TESTING — Synalum

## Ringkasan lapisan

| Lapisan | Perintah | Isi |
|---|---|---|
| Tes API | `npm test` di `synalum-api/` | 9 tes `node:test` end-to-end melawan server asli + SQLite sementara |
| Lint client | `npm run lint` di `synalum-client/` | ESLint |
| Gate P0 | `node scripts/check-p0.mjs` | Anti-slop + kejujuran data di client |
| Advisory sweep | `python3 scripts/advisory-sweep.py` | OSV, 3 lockfile, produksi saja |
| Gitleaks | job CI | Riwayat penuh |
| E2E Playwright | `npx playwright test` di `synalum-client/` | Build demo, desktop + Pixel 7, video tur |
| Smoke | job CI | API lokal: health + register + login + feed |

## Tes API (`synalum-api/test/api.test.js`)

Server di-spawn di port acak dengan `SYNALUM_DB_PATH` ke folder tmp dan
`JWT_SECRET` tes — tidak menyentuh `synalum.db` pengembangan. Yang
diuji (tanpa mock):

1. health + root ping; 2. endpoint auth menolak tanpa token (401);
3. register: duplikat 409, password pendek 400, role liar 400;
4. login password salah 401; 5. alur penuh alumni posting →
   mahasiswa melamar → duplikat 409 → alumni melihat pelamar →
   terima lamaran → mahasiswa lain tidak bisa mengubah status (403);
6. dosen posting → badge `RESMI_USK`; 7. OTP: salah 400, benar 200,
   pakai ulang 400; 8. submit-docs: kosong 400, OK
   `pending_moderator`, mahasiswa dilarang masuk jalur alumni (403);
9. route tak dikenal 404 JSON.

Jalankan lokal:

```bash
cd synalum-api && npm ci && npm test
```

## E2E Playwright (`synalum-client/e2e/`)

Melawan **build demo** (`VITE_DEMO_MODE=true` + `vite preview`):
landing, daftar mahasiswa → feed 3 contoh → lamar, login ulang,
daftar alumni → OTP demo `123456` → submit dokumen → posting peluang,
OTP salah ditolak, dosen posting → badge RESMI USK, tanpa overflow
horizontal di mobile. File `tour.spec.js` merekam video tur untuk
README; `app.spec.js` mengambil screenshot README ke `e2e/shots/`.

Jalankan lokal (butuh Chromium — TIDAK BISA di VM dev; hanya di CI):

```bash
cd synalum-client && npm ci
npm install --no-save @playwright/test@1.55.0
npx playwright install --with-deps chromium
VITE_DEMO_MODE=true npm run build
npx playwright test
```

## Gate P0 (`scripts/check-p0.mjs`)

Memindai `synalum-client/src/pages`, `src/components`, `src/index.css`:
gradient, font Inter, emoji ikon, statistik vanity, skor dummy, nama
hardcode, `alert(`, radius/bayangan di luar kontrak. Baris komentar
penanda perbaikan dikecualikan (mengandung "menggantikan" / "audit 19
Nov" / "DIHAPUS").

## Catatan VM

Chrome/Chromium lokal TIDAK BISA start di VM ini — screenshot, video,
dan e2e lokal tidak bisa. Semua bukti visual diambil dari artifact CI
Playwright (`e2e-media`), diunduh pola 302 → Azure Blob tanpa header
auth surrogate (lihat `~/workspace/github-actions/fetch_ci_artifact.py`).
