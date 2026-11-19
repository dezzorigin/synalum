import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import DemoBanner from '../components/DemoBanner.jsx'

/**
 * Landing Synalum — "Buku besar kampus" (docs/DESIGN.md).
 * Header garis aturan tebal, kolom kiri narasi + kolom kanan kartu anggota
 * (login), di bawahnya alur 3 langkah + 3 pilar sebagai baris ledger.
 * Tanpa gradient, tanpa emoji fungsi, tanpa statistik tanpa sumber.
 */

function IconMentor() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b5e66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
      <path d="M16 8.5a3 3 0 1 1 2.5 4.6" />
      <path d="M17.5 15.5c2 .6 3.4 2 3.9 4.5" />
    </svg>
  )
}

function IconBriefcase() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b5e66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </svg>
  )
}

function IconFlask() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0b5e66" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 3h5" />
      <path d="M10.5 3v5.2L5.8 17a2.4 2.4 0 0 0 2.1 3.6h8.2a2.4 2.4 0 0 0 2.1-3.6L13.5 8.2V3" />
      <path d="M7.5 14.5h9" />
    </svg>
  )
}

export default function LandingPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const navigate = useNavigate()
  const { login } = useAuth()

  // Tiga pilar — isi dari README/PRD repo, bukan klaim angka.
  const pillars = useMemo(
    () => [
      { icon: <IconMentor />, title: 'Mentorship', desc: 'Terhubung langsung dengan alumni berpengalaman sebagai mentor karier.' },
      { icon: <IconBriefcase />, title: 'Magang', desc: 'Temukan peluang magang resmi dari alumni, dosen, dan mitra USK.' },
      { icon: <IconFlask />, title: 'Riset', desc: 'Kolaborasi riset lintas angkatan bersama dosen dan alumni peneliti.' },
    ],
    [],
  )

  // Alur yang memang ada di aplikasi (bukan statistik).
  const steps = useMemo(
    () => [
      { no: '01', title: 'Daftar sebagai peranmu', desc: 'Mahasiswa, alumni, atau dosen — peran menentukan dashboard dan fiturnya.' },
      { no: '02', title: 'Alumni diverifikasi', desc: 'OTP email lalu tautan LinkedIn/ijazah. Tanpa verifikasi, dashboard alumni terkunci.' },
      { no: '03', title: 'Lamar atau posting peluang', desc: 'Mahasiswa melamar; alumni dan dosen memposting lalu mereview pelamar.' },
    ],
    [],
  )

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)
    try {
      const user = await login({ email: identifier, password })
      const roleToPath = {
        mahasiswa: '/dashboard/student',
        alumni: '/dashboard/alumni',
        dosen: '/dashboard/dosen',
        admin: '/dashboard/dosen',
      }
      navigate(roleToPath[user?.role] || '/', { replace: true })
    } catch (error) {
      const msg = error?.response?.data?.message || 'Login gagal. Pastikan email & password benar, dan backend aktif.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#f6f4ee', color: '#1f2a28' }}>
      <DemoBanner />

      {/* ── Header: garis aturan tebal ala buku besar ── */}
      <header className="mx-auto max-w-6xl px-4 pt-5 md:px-6">
        <nav className="flex items-center justify-between gap-3" aria-label="Navigasi utama">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md text-base font-bold text-white"
              style={{ background: '#0b5e66', fontFamily: "'Fraunces', Georgia, serif" }}
              aria-hidden="true"
            >
              S
            </div>
            <div>
              <span className="block text-lg font-bold leading-none tracking-wide" style={{ color: '#0b5e66' }}>
                SYNALUM
              </span>
              <span className="ledger-num mt-1 block text-[11px] uppercase tracking-widest" style={{ color: '#5c665f' }}>
                Universitas Syiah Kuala
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="btn-ghost text-sm"
            id="nav-register-btn"
          >
            Daftar Sekarang
          </button>
        </nav>
        <div className="rule-thick mt-4" aria-hidden="true" />
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-16 pt-8 md:grid-cols-2 md:gap-14 md:px-6 md:pt-12">
        {/* ── Kolom kiri: narasi ── */}
        <section className="flex flex-col justify-center animate-slide-up" aria-labelledby="hero-title">
          <p className="ledger-num text-xs font-semibold uppercase tracking-widest" style={{ color: '#b3402e' }}>
            Sinergi Alumni — Mahasiswa · USK
          </p>

          <h1
            id="hero-title"
            className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight md:text-5xl"
            style={{ fontFamily: "'Fraunces', Georgia, serif", color: '#1f2a28' }}
          >
            Satu kampus. Tiga jembatan karier.
          </h1>
          <div className="mt-4 h-1 w-16 rounded-full" style={{ background: '#e8a33d' }} aria-hidden="true" />

          <p className="mt-5 max-w-lg text-base leading-relaxed" style={{ color: '#3d4a45' }}>
            Temukan peluang <strong>magang</strong>, <strong>mentorship</strong>, dan{' '}
            <strong>kolaborasi riset</strong> dari alumni, mahasiswa, dan dosen
            Universitas Syiah Kuala — semua dalam satu ekosistem terverifikasi.
          </p>

          {/* ── Cara kerja: 3 baris ledger ── */}
          <ol className="mt-8 space-y-0 border-t" style={{ borderColor: '#ddd6c4' }}>
            {steps.map((s) => (
              <li
                key={s.no}
                className="flex gap-4 border-b py-4"
                style={{ borderColor: '#ddd6c4' }}
              >
                <span className="ledger-num text-sm font-bold" style={{ color: '#e8a33d' }}>
                  {s.no}
                </span>
                <div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <p className="mt-1 max-w-md text-sm leading-relaxed" style={{ color: '#5c665f' }}>
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {/* ── Tiga pilar: baris ledger dengan ikon SVG ── */}
          <div className="mt-8">
            <h2 className="ledger-num text-xs font-semibold uppercase tracking-widest" style={{ color: '#5c665f' }}>
              Tiga pilar
            </h2>
            <ul className="mt-3 space-y-3">
              {pillars.map((f) => (
                <li key={f.title} className="flex items-start gap-3 rounded-[10px] border bg-white p-4" style={{ borderColor: '#ddd6c4', background: '#fffdf8' }}>
                  <span className="mt-0.5 shrink-0" aria-hidden="true">{f.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{f.title}</div>
                    <p className="mt-0.5 text-sm leading-relaxed" style={{ color: '#5c665f' }}>{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              id="hero-register-btn"
              onClick={() => navigate('/register')}
              className="btn-primary text-sm"
            >
              Mulai Bergabung
              <span aria-hidden="true">→</span>
            </button>
            <span className="text-sm" style={{ color: '#5c665f' }}>Sudah punya akun? Login di kartu anggota.</span>
          </div>
        </section>

        {/* ── Kolom kanan: kartu anggota (login) ── */}
        <aside className="flex items-start justify-center md:pt-2 animate-slide-up" style={{ animationDelay: '0.1s' }} aria-labelledby="login-title">
          <div
            className="relative w-full max-w-md rounded-[10px] border p-6 shadow-sm sm:p-8"
            style={{ borderColor: '#ddd6c4', background: '#fffdf8' }}
          >
            <span className="stamp px-3 py-1 text-[11px]" aria-hidden="true">Anggota · USK</span>
            <h2 id="login-title" className="mt-4 text-2xl font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Kartu Anggota
            </h2>
            <p className="mt-1 text-sm" style={{ color: '#5c665f' }}>
              Masuk dengan email dan kata sandi akun Synalum Anda.
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} id="login-form">
              {errorMessage && (
                <div
                  role="alert"
                  className="animate-fade-in rounded-md border px-4 py-3 text-sm"
                  style={{ background: '#fdf0ec', borderColor: '#b3402e', color: '#7a2418' }}
                >
                  {errorMessage}
                </div>
              )}

              <div>
                <label htmlFor="login-identifier" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#3d4a45' }}>
                  Email
                </label>
                <input
                  id="login-identifier"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nama@usk.ac.id"
                  type="email"
                  autoComplete="email"
                  required
                  className="input-base"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: '#3d4a45' }}>
                  Kata Sandi
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="input-base pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                    style={{ color: '#5c665f' }}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? 'Sembunyi' : 'Lihat'}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Memproses...
                  </span>
                ) : (
                  'Masuk ke Dashboard →'
                )}
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between text-sm" style={{ color: '#5c665f' }}>
              <span>Belum punya akun?</span>
              <button
                type="button"
                id="login-to-register-btn"
                onClick={() => navigate('/register')}
                className="font-semibold transition hover:opacity-75"
                style={{ color: '#0b5e66' }}
              >
                Daftar sekarang →
              </button>
            </div>

            <div className="mt-4 rounded-md border p-3 text-xs leading-relaxed" style={{ background: '#f6f4ee', borderColor: '#ddd6c4', color: '#3d4a45' }}>
              <strong>Mode demo:</strong> daftar akun baru lalu login — data
              tersimpan di browser Anda. Untuk data sungguhan, jalankan API
              lokal (lihat README).
            </div>
          </div>
        </aside>
      </div>

      {/* ── Footer: garis aturan + status jujur ── */}
      <footer className="mx-auto max-w-6xl px-4 pb-8 md:px-6">
        <div className="rule-thin" aria-hidden="true" />
        <p className="ledger-num mt-4 text-xs" style={{ color: '#5c665f' }}>
          Synalum · Universitas Syiah Kuala · Backend: Express + SQLite lokal ·
          API tidak ikut ter-deploy di halaman ini (mode demo)
        </p>
      </footer>
    </main>
  )
}
