/**
 * Mode demo — mock API di dalam browser (dipakai build Pages).
 *
 * Aktif hanya bila build memakai `VITE_DEMO_MODE=true` (lihat api.js).
 * Seluruh "backend" tinggal di localStorage (`synalum_demo_v1`) — tidak ada
 * server, tidak ada akun sungguhan. Data bawaan DILABELI "Contoh" di UI.
 *
 * Permukaan yang di-mock SAMA dengan synalum-api (method + path + bentuk
 * respons + kode status), supaya alur yang diuji di mode demo sama dengan
 * alur melawan API asli: register → login → posting peluang → lamaran →
 * review pelamar → update status, plus verifikasi OTP 2 lapis.
 *
 * Batasan yang jujur: kata sandi hanya di-hash ringan (bukan bcrypt) dan
 * token demo (`demo.<id>`) bukan JWT — JANGAN pakai pola ini di luar demo.
 * OTP demo selalu "123456" dan ditampilkan apa adanya sebagai simulasi.
 */

const KEY = 'synalum_demo_v1'
const DEMO_OTP = '123456'

function hashDemo(password) {
  let h = 5381
  for (let i = 0; i < password.length; i++) {
    h = ((h << 5) + h + password.charCodeAt(i)) >>> 0
  }
  return `demo-hash-${h.toString(16)}`
}

function seed() {
  return {
    seq: { user: 100, opportunity: 100, application: 100, verification: 100 },
    users: [],
    opportunities: [
      {
        id: 1,
        created_by_user_id: 0,
        title: 'Mentorship Backend — 6 sesi (Contoh)',
        description:
          'Contoh peluang dari alumni: bimbingan membangun REST API dengan Node.js & SQLite, 6 sesi daring.',
        badge_source: 'ALUMNI_POST',
        is_active: 1,
        created_at: '2026-11-19T08:00:00.000Z',
        demo_seed: true,
      },
      {
        id: 2,
        created_by_user_id: 0,
        title: 'Asisten Riset AI — Lab Informatika USK (Contoh)',
        description:
          'Contoh peluang resmi: membantu riset dosen di lab, pengolahan data dan penulisan laporan.',
        badge_source: 'RESMI_USK',
        is_active: 1,
        created_at: '2026-11-19T07:00:00.000Z',
        demo_seed: true,
      },
      {
        id: 3,
        created_by_user_id: 0,
        title: 'Magang Frontend — Mitra Kampus (Contoh)',
        description:
          'Contoh peluang eksternal: magang 3 bulan membangun antarmuka React untuk mitra kampus.',
        badge_source: 'EKSTERNAL',
        is_active: 1,
        created_at: '2026-11-19T06:00:00.000Z',
        demo_seed: true,
      },
    ],
    applications: [],
    verifications: [],
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // data rusak → seed ulang
  }
  const fresh = seed()
  save(fresh)
  return fresh
}

function save(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

function badgeByRole(role) {
  if (role === 'dosen' || role === 'admin') return 'RESMI_USK'
  if (role === 'alumni') return 'ALUMNI_POST'
  return 'EKSTERNAL'
}

function fail(status, message) {
  const error = new Error(message)
  error.response = { status, data: { message } }
  throw error
}

function authedUser(state, headers) {
  const auth = headers?.Authorization || headers?.authorization || ''
  const [scheme, token] = String(auth).split(' ')
  if (scheme !== 'Bearer' || !token || !token.startsWith('demo.')) return null
  const id = Number(token.slice('demo.'.length))
  if (!id) return null
  return state.users.find((u) => u.id === id) || null
}

function requireRole(user, roles) {
  if (!user) fail(401, 'Unauthorized: token tidak ditemukan (gunakan Authorization: Bearer <token>)')
  if (!roles.includes(user.role)) fail(403, 'Forbidden: role tidak punya akses ke resource ini')
}

function publicUser(u) {
  return { id: u.id, email: u.email, role: u.role }
}

/** Adapter axios: (config) => Promise<axiosResponse>. */
export async function demoAdapter(config) {
  const state = load()
  const method = String(config.method || 'get').toLowerCase()
  const url = String(config.url || '')
  const path = url.split('?')[0]
  const data = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {}
  const headers = config.headers || {}

  const ok = (status, payload) => ({
    data: payload,
    status,
    statusText: 'OK',
    headers: {},
    config,
  })

  // ─── Root & health ──────────────────────────────────────────────────────
  if (method === 'get' && path === '/api') {
    return ok(200, { message: 'SYNALUM API is running ✅', version: 'v1-sqlite-demo' })
  }
  if (method === 'get' && path === '/api/health') {
    return ok(200, { status: 'ok', serverTime: new Date().toISOString(), db: { ok: true, mode: 'demo' } })
  }

  // ─── Auth ───────────────────────────────────────────────────────────────
  if (method === 'post' && path === '/api/auth/register') {
    const email = String(data.email || '').trim().toLowerCase()
    const password = String(data.password || '')
    const role = String(data.role || '').trim()
    if (!email || !password || !role) fail(400, 'email, password, dan role wajib diisi')
    if (!['mahasiswa', 'alumni', 'dosen', 'admin'].includes(role)) {
      fail(400, 'role tidak valid (mahasiswa | alumni | dosen | admin)')
    }
    if (password.length < 6) fail(400, 'Password minimal 6 karakter')
    if (state.users.some((u) => u.email === email)) fail(409, 'Email sudah terdaftar')
    const user = { id: state.seq.user++, email, password_hash: hashDemo(password), role }
    state.users.push(user)
    save(state)
    return ok(201, { message: 'Register berhasil', user: publicUser(user) })
  }

  if (method === 'post' && path === '/api/auth/login') {
    const email = String(data.email || '').trim().toLowerCase()
    const password = String(data.password || '')
    const user = state.users.find((u) => u.email === email)
    if (!user || user.password_hash !== hashDemo(password)) {
      fail(401, 'Email atau password salah')
    }
    return ok(200, {
      message: 'Login berhasil',
      token: `demo.${user.id}`,
      user: publicUser(user),
    })
  }

  const user = authedUser(state, headers)

  // ─── Opportunities ──────────────────────────────────────────────────────
  if (method === 'get' && path === '/api/opportunities/all') {
    if (!user) fail(401, 'Unauthorized: token tidak ditemukan (gunakan Authorization: Bearer <token>)')
    const opportunities = [...state.opportunities]
      .filter((o) => o.is_active === 1)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    return ok(200, { opportunities })
  }

  if (method === 'post' && path === '/api/opportunities/create') {
    requireRole(user, ['dosen', 'alumni', 'admin'])
    const title = String(data.title || '').trim()
    const description = String(data.description || '').trim()
    if (!title) fail(400, 'title wajib diisi')
    const opp = {
      id: state.seq.opportunity++,
      created_by_user_id: user.id,
      title,
      description: description || null,
      badge_source: badgeByRole(user.role),
      is_active: 1,
      created_at: new Date().toISOString(),
    }
    state.opportunities.push(opp)
    save(state)
    return ok(201, { message: 'Peluang berhasil diposting', opportunity: opp })
  }

  // ─── Applications ───────────────────────────────────────────────────────
  if (method === 'post' && path === '/api/applications/apply') {
    requireRole(user, ['mahasiswa'])
    const opportunityId = Number(data.opportunity_id ?? data.opportunityId)
    if (!opportunityId || Number.isNaN(opportunityId)) fail(400, 'opportunity_id wajib diisi')
    const opp = state.opportunities.find((o) => o.id === opportunityId)
    if (!opp) fail(404, 'Opportunity tidak ditemukan')
    if (!opp.is_active) fail(400, 'Opportunity sudah tidak aktif')
    if (state.applications.some((a) => a.opportunity_id === opportunityId && a.student_user_id === user.id)) {
      fail(409, 'Anda sudah melamar peluang ini')
    }
    const app = {
      id: state.seq.application++,
      opportunity_id: opportunityId,
      student_user_id: user.id,
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    state.applications.push(app)
    save(state)
    return ok(201, { message: 'Lamaran berhasil dikirim', application: app })
  }

  const applicantsMatch = path.match(/^\/api\/applications\/(\d+)\/applicants$/)
  if (method === 'get' && applicantsMatch) {
    requireRole(user, ['alumni', 'dosen', 'admin'])
    const opportunityId = Number(applicantsMatch[1])
    const opp = state.opportunities.find((o) => o.id === opportunityId && o.created_by_user_id === user.id)
    if (!opp) fail(403, 'Anda tidak punya akses ke pelamar untuk peluang ini')
    const applicants = state.applications
      .filter((a) => a.opportunity_id === opportunityId)
      .map((a) => {
        const s = state.users.find((u) => u.id === a.student_user_id) || {}
        return { id: a.id, status: a.status, created_at: a.created_at, student_user_id: a.student_user_id, student_email: s.email || '?' }
      })
    return ok(200, { opportunity_id: opportunityId, applicants })
  }

  const statusMatch = path.match(/^\/api\/applications\/(\d+)\/status$/)
  if (method === 'put' && statusMatch) {
    requireRole(user, ['alumni', 'dosen', 'admin'])
    const applicationId = Number(statusMatch[1])
    const nextStatus = String(data.status || '').trim()
    if (!['accepted', 'rejected'].includes(nextStatus)) fail(400, "status harus 'accepted' atau 'rejected'")
    const app = state.applications.find((a) => a.id === applicationId)
    const opp = app && state.opportunities.find((o) => o.id === app.opportunity_id && o.created_by_user_id === user.id)
    if (!app || !opp) fail(403, 'Anda tidak punya akses untuk mengubah status lamaran ini')
    app.status = nextStatus
    save(state)
    return ok(200, { message: 'Status lamaran berhasil diupdate', application: app })
  }

  // ─── Verifikasi alumni ──────────────────────────────────────────────────
  if (method === 'post' && path === '/api/verify/request-otp') {
    requireRole(user, ['alumni'])
    const verification = {
      id: state.seq.verification++,
      user_id: user.id,
      status: 'pending',
      layer_level: 1,
      created_at: new Date().toISOString(),
    }
    state.verifications.push(verification)
    save(state)
    return ok(200, {
      message: 'OTP berhasil dibuat (simulasi email terkirim)',
      otp: DEMO_OTP,
      verification,
    })
  }

  if (method === 'post' && path === '/api/verify/confirm-otp') {
    requireRole(user, ['alumni'])
    const otp = String(data.otp || '').trim()
    if (!otp) fail(400, 'otp wajib diisi')
    const latest = [...state.verifications]
      .filter((v) => v.user_id === user.id && v.layer_level === 1 && v.status === 'pending')
      .pop()
    if (!latest || otp !== DEMO_OTP) fail(400, 'OTP tidak cocok atau sudah kedaluwarsa. Minta kode baru.')
    latest.status = 'approved'
    save(state)
    return ok(200, { message: 'OTP terverifikasi', verification: latest })
  }

  if (method === 'post' && path === '/api/verify/submit-docs') {
    requireRole(user, ['alumni'])
    const finalUrl = String(data.documentUrl || data.document_url || data.linkedinUrl || data.linkedin_url || '').trim()
    if (!finalUrl) fail(400, 'documentUrl / linkedinUrl wajib diisi')
    const verification = {
      id: state.seq.verification++,
      user_id: user.id,
      status: 'pending_moderator',
      layer_level: 2,
      document_url: finalUrl,
      created_at: new Date().toISOString(),
    }
    state.verifications.push(verification)
    save(state)
    return ok(200, { message: 'Dokumen diterima dan menunggu moderasi', verification })
  }

  return ok(404, { message: 'Route tidak ditemukan' })
}

export const DEMO_OTP_VALUE = DEMO_OTP
