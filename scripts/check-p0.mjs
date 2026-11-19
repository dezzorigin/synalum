#!/usr/bin/env node
/**
 * Gate anti-slop P0 + kejujuran data untuk synalum-client.
 *
 * Dijalankan CI (`node scripts/check-p0.mjs` dari root repo) dan lokal.
 * Gagal bila ditemukan di src/pages, src/components, atau src/index.css:
 *  - gradient (linear/radial) di CSS/JSX — latar & teks gradient dilarang
 *  - font Inter diimpor/dipakai
 *  - emoji mentah sebagai ikon fungsi
 *  - statistik vanity tanpa sumber ("12K+", "98% Verified", dst.)
 *  - data dummy yang tampil sebagai data asli ("Skor Relevansi", nama
 *    hardcode "Mahasiswa A/B", label "Dummy Data" yang tampil)
 *  - alert( di UI (ganti dengan notice inline)
 *  - rounded-2xl / rounded-3xl / shadow-lg (radius & bayangan di luar
 *    kontrak docs/DESIGN.md: kartu 10px, tombol/input 6px)
 *
 * Komentar & string dokumentasi dikecualikan bila barisnya mengandung
 * kata "menggantikan" / "audit" / "DIHAPUS" (penanda penjelas perbaikan).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const CLIENT = join(ROOT, 'synalum-client', 'src')
const DIRS = [join(CLIENT, 'pages'), join(CLIENT, 'components')]
const FILES = [join(CLIENT, 'index.css')]

function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(jsx?|css)$/.test(entry)) FILES.push(p)
  }
}
for (const d of DIRS) walk(d)

const CHECKS = [
  { name: 'gradient', re: /(linear-gradient|radial-gradient|bg-gradient-to-|bg-clip-text|text-gradient)/ },
  { name: 'font Inter', re: /Inter(?![a-z])/ },
  { name: 'emoji ikon fungsi', re: /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u },
  { name: 'statistik vanity', re: /12K\+|450['"]?\s*(Co-Mentors|mentor)|98%\s*(Verified|terverifikasi)/ },
  { name: 'skor dummy', re: /Skor Relevansi/ },
  { name: 'nama hardcode dummy', re: /Mahasiswa [AB]['"]/ },
  { name: 'alert()', re: /\balert\s*\(/ },
  { name: 'radius/bayangan di luar kontrak', re: /rounded-2xl|rounded-3xl|shadow-lg/ },
]

const EXEMPT = /menggantikan|audit 19 Nov|DIHAPUS|bukan shadow-lg/
let failures = 0

for (const file of FILES) {
  const lines = readFileSync(file, 'utf8').split('\n')
  lines.forEach((line, i) => {
    if (EXEMPT.test(line)) return
    for (const { name, re } of CHECKS) {
      if (re.test(line)) {
        console.log(`FAIL ${name}: ${file.replace(ROOT, '')}:${i + 1}: ${line.trim().slice(0, 120)}`)
        failures++
      }
    }
  })
}

if (failures > 0) {
  console.log(`\ncheck-p0: ${failures} pelanggaran P0 — lihat docs/DESIGN.md`)
  process.exit(1)
}
console.log(`check-p0: OK (${FILES.length} file diperiksa, 0 pelanggaran P0)`)
