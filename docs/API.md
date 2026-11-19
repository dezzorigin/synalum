# API — Synalum

> Base URL lokal: `http://localhost:5000` (Vite mem-proxy `/api` ke sana
> saat `npm run dev` di client). Semua respons JSON. Token: header
> `Authorization: Bearer <JWT>`.
>
> Mode demo (Pages) memakai permukaan yang sama — lihat
> `synalum-client/src/utils/demoApi.js`.

## Publik

| Method & path | Auth | Keterangan |
|---|---|---|
| `GET /api` | — | Ping: `{ message, version: 'v1-sqlite' }` |
| `GET /api/health` | — | `{ status: 'ok', serverTime, db: { ok, time } }` |
| `POST /api/auth/register` | — | Body `{ email, password, role }`. 201 `{ user }`; 409 email sudah terdaftar; 400 validasi (password min. 6, role whitelist) |
| `POST /api/auth/login` | — | Body `{ email, password }`. 200 `{ token, user }`; 401 salah |

## Terautentikasi

| Method & path | Peran | Keterangan |
|---|---|---|
| `GET /api/opportunities/all` | semua login | Feed peluang aktif, terbaru dulu. 401 tanpa token |
| `POST /api/opportunities/create` | alumni, dosen, admin | Body `{ title, description? }`. 201; `badge_source` diisi server dari peran (dosen/admin → `RESMI_USK`, alumni → `ALUMNI_POST`) |
| `POST /api/applications/apply` | mahasiswa | Body `{ opportunity_id }`. 201; 409 sudah melamar; 404 peluang tidak ada; 400 peluang nonaktif |
| `GET /api/applications/:opportunityId/applicants` | alumni, dosen, admin | Hanya peluang milik sendiri, kalau bukan → 403 |
| `PUT /api/applications/:id/status` | alumni, dosen, admin | Body `{ status: 'accepted' \| 'rejected' }`. Hanya lamaran di peluang sendiri → 403 |
| `POST /api/verify/request-otp` | alumni | Membuat baris verifikasi lapis 1. Mengembalikan `otp` hanya bila `SYNALUM_OTP_DEMO=1` |
| `POST /api/verify/confirm-otp` | alumni | Body `{ otp }`. Cocok dengan lapis-1 pending terbaru → 200 `approved`; salah/kedaluwarsa → 400; OTP tidak bisa dipakai dua kali |
| `POST /api/verify/submit-docs` | alumni | Body `{ documentUrl \| linkedinUrl }`. 200 `{ verification: { status: 'pending_moderator', layer_level: 2 } }` |

## Contoh (curl, API lokal)

```bash
# register + login
curl -s -X POST localhost:5000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"alumni@usk.ac.id","password":"rahasia1","role":"alumni"}'
TOKEN=$(curl -s -X POST localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alumni@usk.ac.id","password":"rahasia1"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')

# posting peluang (badge ALUMNI_POST dari peran)
curl -s -X POST localhost:5000/api/opportunities/create \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Mentorship Backend","description":"Bimbingan 6 sesi."}'

# feed (butuh token apa pun)
curl -s localhost:5000/api/opportunities/all -H "Authorization: Bearer $TOKEN"
```

## Error

Semua error berbentuk `{ message: '...' }` berbahasa Indonesia:
401 token tidak ada/tidak valid · 403 peran/kepemilikan tidak cocok ·
404 route atau peluang tidak ada · 409 duplikat · 400 validasi ·
500 kesalahan server (dilog ke stderr server).
