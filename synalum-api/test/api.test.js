/**
 * Tes API Synalum — end-to-end nyata melawan server Express + SQLite.
 *
 * Dijalankan CI (`npm test` di synalum-api) dan lokal. Server di-spawn di
 * port acak dengan database SQLite SEMENTARA (SYNALUM_DB_PATH di folder
 * tmp) + JWT_SECRET tes, jadi tidak menyentuh synalum.db pengembangan.
 * Tanpa mock: register → login → posting peluang → lamaran → review
 * pelamar → update status, plus verifikasi OTP server-side.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after, before } from 'node:test'

const API_DIR = new URL('..', import.meta.url).pathname
const PORT = 18_700 + Math.floor(Math.random() * 500)
const BASE = `http://127.0.0.1:${PORT}`

let server
let dir

async function waitUp() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${BASE}/api/health`)
      if (res.ok) return
    } catch {
      // belum hidup
    }
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new Error('API tidak hidup')
}

async function req(path, { method = 'GET', token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    // respons tanpa JSON
  }
  return { status: res.status, data }
}

async function registerLogin(email, password, role) {
  const reg = await req('/api/auth/register', {
    method: 'POST',
    body: { email, password, role },
  })
  assert.equal(reg.status, 201, `register ${role}: ${JSON.stringify(reg.data)}`)
  const login = await req('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  })
  assert.equal(login.status, 200, `login ${role}: ${JSON.stringify(login.data)}`)
  assert.equal(typeof login.data.token, 'string')
  assert.equal(login.data.user.role, role)
  return { token: login.data.token, user: login.data.user }
}

before(async () => {
  dir = await mkdtemp(join(tmpdir(), 'synalum-test-'))
  server = spawn('node', ['server.js'], {
    cwd: API_DIR,
    env: {
      ...process.env,
      PORT: String(PORT),
      JWT_SECRET: 'tes-synalum-rahasia-ci',
      SYNALUM_DB_PATH: join(dir, 'test.db'),
      SYNALUM_OTP_DEMO: '1',
    },
    stdio: 'pipe',
  })
  let log = ''
  server.stdout.on('data', (d) => {
    log += d
  })
  server.stderr.on('data', (d) => {
    log += d
  })
  server.__log = () => log
  await waitUp()
})

after(async () => {
  if (server) server.kill()
  if (dir) await rm(dir, { recursive: true, force: true })
})

test('health + root ping', async () => {
  const health = await req('/api/health')
  assert.equal(health.status, 200)
  assert.equal(health.data.status, 'ok')
  assert.equal(health.data.db.ok, true)

  const root = await req('/api')
  assert.equal(root.status, 200)
  assert.match(root.data.message, /SYNALUM API/)
})

test('endpoint terautentikasi menolak tanpa token', async () => {
  const res = await req('/api/opportunities/all')
  assert.equal(res.status, 401)
})

test('register menolak email duplikat dan password pendek', async () => {
  const first = await req('/api/auth/register', {
    method: 'POST',
    body: { email: 'duplikat@usk.ac.id', password: 'rahasia1', role: 'mahasiswa' },
  })
  assert.equal(first.status, 201)

  const dup = await req('/api/auth/register', {
    method: 'POST',
    body: { email: 'duplikat@usk.ac.id', password: 'rahasia1', role: 'mahasiswa' },
  })
  assert.equal(dup.status, 409)

  const short = await req('/api/auth/register', {
    method: 'POST',
    body: { email: 'pendek@usk.ac.id', password: '123', role: 'mahasiswa' },
  })
  assert.equal(short.status, 400)

  const badRole = await req('/api/auth/register', {
    method: 'POST',
    body: { email: 'role@usk.ac.id', password: 'rahasia1', role: 'rektor' },
  })
  assert.equal(badRole.status, 400)
})

test('login menolak password salah', async () => {
  await req('/api/auth/register', {
    method: 'POST',
    body: { email: 'salah@usk.ac.id', password: 'benar123', role: 'mahasiswa' },
  })
  const bad = await req('/api/auth/login', {
    method: 'POST',
    body: { email: 'salah@usk.ac.id', password: 'keliru123' },
  })
  assert.equal(bad.status, 401)
})

test('alur penuh: alumni posting → mahasiswa melamar → alumni mereview', async () => {
  const alumni = await registerLogin('alumni@usk.ac.id', 'rahasia1', 'alumni')
  const student = await registerLogin('mhs@usk.ac.id', 'rahasia1', 'mahasiswa')

  // Mahasiswa tidak boleh posting peluang
  const forbidden = await req('/api/opportunities/create', {
    method: 'POST',
    token: student.token,
    body: { title: 'Tidak boleh', description: 'x' },
  })
  assert.equal(forbidden.status, 403)

  // Alumni posting → badge ALUMNI_POST dari peran
  const created = await req('/api/opportunities/create', {
    method: 'POST',
    token: alumni.token,
    body: { title: 'Mentorship Backend (tes)', description: 'Bimbingan 6 sesi.' },
  })
  assert.equal(created.status, 201)
  assert.equal(created.data.opportunity.badge_source, 'ALUMNI_POST')
  const oppId = created.data.opportunity.id

  // Feed terlihat mahasiswa
  const feed = await req('/api/opportunities/all', { token: student.token })
  assert.equal(feed.status, 200)
  assert.ok(feed.data.opportunities.some((o) => o.id === oppId))

  // Mahasiswa melamar, lalu duplikat ditolak
  const applied = await req('/api/applications/apply', {
    method: 'POST',
    token: student.token,
    body: { opportunity_id: oppId },
  })
  assert.equal(applied.status, 201)
  const appId = applied.data.application.id

  const dup = await req('/api/applications/apply', {
    method: 'POST',
    token: student.token,
    body: { opportunity_id: oppId },
  })
  assert.equal(dup.status, 409)

  // Alumni melihat pelamar dan menerima lamaran
  const applicants = await req(`/api/applications/${oppId}/applicants`, {
    token: alumni.token,
  })
  assert.equal(applicants.status, 200)
  assert.equal(applicants.data.applicants.length, 1)
  assert.equal(applicants.data.applicants[0].student_email, 'mhs@usk.ac.id')

  const accepted = await req(`/api/applications/${appId}/status`, {
    method: 'PUT',
    token: alumni.token,
    body: { status: 'accepted' },
  })
  assert.equal(accepted.status, 200)
  assert.equal(accepted.data.application.status, 'accepted')

  // Mahasiswa lain tidak bisa mengubah status lamaran orang
  const other = await registerLogin('mhs2@usk.ac.id', 'rahasia1', 'mahasiswa')
  const blocked = await req(`/api/applications/${appId}/status`, {
    method: 'PUT',
    token: other.token,
    body: { status: 'rejected' },
  })
  assert.equal(blocked.status, 403)
})

test('dosen posting peluang mendapat badge RESMI_USK', async () => {
  const lecturer = await registerLogin('dosen@usk.ac.id', 'rahasia1', 'dosen')
  const created = await req('/api/opportunities/create', {
    method: 'POST',
    token: lecturer.token,
    body: { title: 'Asisten Riset AI (tes)', description: 'Lab USK.' },
  })
  assert.equal(created.status, 201)
  assert.equal(created.data.opportunity.badge_source, 'RESMI_USK')
})

test('verifikasi OTP divalidasi di server, bukan di client', async () => {
  const alumni = await registerLogin('alumni-otp@usk.ac.id', 'rahasia1', 'alumni')

  const issued = await req('/api/verify/request-otp', {
    method: 'POST',
    token: alumni.token,
  })
  assert.equal(issued.status, 200)
  assert.equal(typeof issued.data.otp, 'string')
  assert.equal(issued.data.otp.length, 6)

  // OTP salah ditolak
  const wrong = await req('/api/verify/confirm-otp', {
    method: 'POST',
    token: alumni.token,
    body: { otp: '000000' },
  })
  assert.equal(wrong.status, 400)

  // OTP benar diterima, dan tidak bisa dipakai dua kali
  const ok = await req('/api/verify/confirm-otp', {
    method: 'POST',
    token: alumni.token,
    body: { otp: issued.data.otp },
  })
  assert.equal(ok.status, 200)
  assert.equal(ok.data.verification.status, 'approved')

  const reuse = await req('/api/verify/confirm-otp', {
    method: 'POST',
    token: alumni.token,
    body: { otp: issued.data.otp },
  })
  assert.equal(reuse.status, 400)
})

test('submit dokumen butuh URL dan peran alumni', async () => {
  const alumni = await registerLogin('alumni-doc@usk.ac.id', 'rahasia1', 'alumni')
  const student = await registerLogin('mhs-doc@usk.ac.id', 'rahasia1', 'mahasiswa')

  const empty = await req('/api/verify/submit-docs', {
    method: 'POST',
    token: alumni.token,
    body: {},
  })
  assert.equal(empty.status, 400)

  const ok = await req('/api/verify/submit-docs', {
    method: 'POST',
    token: alumni.token,
    body: { documentUrl: 'https://linkedin.com/in/contoh' },
  })
  assert.equal(ok.status, 200)
  assert.equal(ok.data.verification.status, 'pending_moderator')

  // Mahasiswa tidak boleh masuk jalur verifikasi alumni
  const forbidden = await req('/api/verify/request-otp', {
    method: 'POST',
    token: student.token,
  })
  assert.equal(forbidden.status, 403)
})

test('route tak dikenal 404 JSON', async () => {
  const res = await req('/api/tidak-ada')
  assert.equal(res.status, 404)
})
