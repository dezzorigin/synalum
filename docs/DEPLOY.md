# DEPLOY — Synalum

## Yang live: client (Cloudflare Pages)

- URL: **https://synalum.pages.dev/**
- Proyek Pages: `synalum` (nama pertama, tersedia — tidak perlu fallback).
- Yang di-deploy: `synalum-client/dist/` hasil `VITE_DEMO_MODE=true
  npm run build` — aplikasi React lengkap dalam **mode demo** (mock API
  di browser, lihat `docs/ARCHITECTURE.md` §4). Akun & data demo
  tersimpan di browser pengunjung; peluang bawaan berlabel "Contoh".
- Cara deploy (dari VM, token Cloudflare di vault — jangan minta
  kredensial):

```bash
# 1. Ambil dist/ dari artifact CI job client-build (nama: pages-dist)
python3 ~/workspace/github-actions/fetch_ci_artifact.py \
  dezzorigin/synalum <ARTIFACT_ID> /tmp/pages-dist.zip
unzip -o /tmp/pages-dist.zip -d ~/workspace/synalum-deploy/
# 2. Deploy
python3 ~/workspace/github-actions/cf_pages.py deploy synalum ~/workspace/synalum-deploy/
```

- Routing: `HashRouter` — Pages direct-upload tidak punya server
  rewrite (`_redirects` tidak ikut ter-upload oleh `cf_pages.py`),
  jadi semua route tinggal di `index.html` yang sama. Jangan ganti ke
  `BrowserRouter` tanpa menyiapkan rewrite.
- Verifikasi live: root 200 + teks "Satu kampus. Tiga jembatan karier."
  di `index.html` hasil build + semua tag `og:`/`twitter:` +
  `og-image.png` 200 `image/*`. Untuk SPA, marker produk ada di bundle
  JS hasil build, bukan di `index.html` (shell kosong).

## Yang BELUM live: API (Express + SQLite)

API **tidak bisa** tinggal di Cloudflare Pages (butuh proses Node +
file SQLite). Status: **follow-up menunggu keputusan Nabil** — sama
seperti repo saudara #32 `synalum-ai-mentor` (API Express-nya juga belum
live). Opsi yang diajukan (belum diputuskan, jangan deploy sendiri):

1. **Docker + Coolify** (VPS bersama) — pola yang sama dengan
   ArticleTemplate: `Dockerfile` + compose, volume untuk `synalum.db`,
   `JWT_SECRET` + `SYNALUM_OTP_DEMO=0` via env Coolify.
2. VPS langsung (systemd + reverse proxy) — lebih rapi tapi butuh akses
   host.

Sampai diputuskan, jalankan API lokal (lihat README) atau pakai mode
demo di Pages. Jangan klaim API "hosted" di mana pun.

## Showcase statis

`Synalum-showcase/` tidak di-deploy (arsip presentasi; dulu Netlify).
Kalau suatu saat mau dipublikasikan, deploy sebagai proyek Pages
terpisah — jangan campur dengan aplikasi.
