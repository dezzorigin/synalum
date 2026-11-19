import { useMemo, useState } from 'react' // useState untuk menyimpan role terpilih, useMemo untuk data roles
import { useNavigate } from 'react-router-dom' // Untuk pindah route (kembali ke landing)
import { useAuth } from '../context/useAuth.js' // Ambil fungsi login agar auto-login setelah register
import { api } from '../utils/api.js'
import DemoBanner from '../components/DemoBanner.jsx'

export default function RegisterRole() {
  const [selectedRole, setSelectedRole] = useState(null) // Nilai: 'mahasiswa' | 'alumni' | 'dosen'
  const [email, setEmail] = useState('') // Email untuk akun baru
  const [password, setPassword] = useState('') // Password akun baru
  const [isSubmitting, setIsSubmitting] = useState(false) // Flag loading saat submit
  const [errorMessage, setErrorMessage] = useState('') // Pesan error jika register gagal
  const navigate = useNavigate() // Dipakai untuk kembali ke halaman landing
  const { login } = useAuth() // Setelah register sukses, langsung login otomatis

  const roles = useMemo(
    () => [
      {
        key: 'mahasiswa', // Disamakan dengan backend (role = mahasiswa)
        title: 'Mahasiswa',
        description: 'Cari peluang magang/mentorship dan bangun portofolio skill.',
      },
      {
        key: 'alumni',
        title: 'Alumni',
        description: 'Buka peluang mentoring/magang dan bantu mahasiswa berkembang.',
      },
      {
        key: 'dosen', // Disamakan dengan backend (role = dosen)
        title: 'Dosen',
        description: 'Bagikan info resmi dan pantau aktivitas karier mahasiswa.',
      },
    ],
    [],
  )

  function handleSelect(roleKey) {
    setSelectedRole(roleKey) // Simpan pilihan user agar UI bisa menandai kartu yang aktif
  }

  async function handleRegister() {
    // Register ke backend, lalu auto-login
    setErrorMessage('') // Reset error
    if (!selectedRole) {
      setErrorMessage('Pilih salah satu peran terlebih dahulu.')
      return
    }
    if (!email || !password) {
      setErrorMessage('Email dan password wajib diisi.')
      return
    }

    setIsSubmitting(true) // Aktifkan loading agar tidak double submit
    try {
      await api.post('/api/auth/register', {
        email, // Email yang diinput user
        password, // Password yang diinput user
        role: selectedRole, // Role yang dipilih user
      }) // Server akan menyimpan user baru (password di-hash)

      const user = await login({ email, password }) // Setelah register, langsung login agar UX cepat

      const roleToPath = {
        mahasiswa: '/dashboard/student',
        alumni: '/dashboard/alumni',
        dosen: '/dashboard/dosen',
        admin: '/dashboard/dosen',
      } // Mapping sederhana role -> dashboard

      navigate(roleToPath[user?.role] || '/', { replace: true }) // Arahkan ke dashboard yang sesuai
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        'Registrasi gagal. Pastikan data valid dan server aktif.'
      setErrorMessage(msg) // Tampilkan error di UI
    } finally {
      setIsSubmitting(false) // Matikan loading
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#f6f4ee', color: '#1f2a28' }}>
      <DemoBanner />

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <div className="rule-thick" aria-hidden="true" />
        <div className="mb-8 mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Pilih Peran Anda
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#5c665f' }}>
              Peran menentukan dashboard, fitur, dan alur verifikasi.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-ghost text-sm"
          >
            ← Kembali
          </button>
        </div>

        {/* Pilih peran: 3 baris ledger, bukan 3 kartu simetris */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3" role="radiogroup" aria-label="Pilih peran">
          {roles.map((role, i) => {
            const isActive = selectedRole === role.key
            return (
              <button
                key={role.key}
                type="button"
                role="radio"
                aria-checked={isActive}
                aria-label={role.title}
                onClick={() => handleSelect(role.key)}
                className="rounded-[10px] border bg-white p-6 text-left shadow-sm transition"
                style={{
                  borderColor: isActive ? '#0b5e66' : '#ddd6c4',
                  background: '#fffdf8',
                  boxShadow: isActive ? '0 0 0 2px rgba(11,94,102,0.25)' : undefined,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="ledger-num text-xs font-bold" style={{ color: '#e8a33d' }}>
                      0{i + 1}
                    </span>
                    <div className="mt-1 text-lg font-semibold" style={{ color: '#0b5e66' }}>
                      {role.title}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: '#5c665f' }}>
                      {role.description}
                    </p>
                  </div>
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm font-bold"
                    style={{
                      background: isActive ? '#0b5e66' : '#eef0e9',
                      color: isActive ? '#fff' : '#0b5e66',
                    }}
                    aria-hidden="true"
                  >
                    {role.title.slice(0, 1)}
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2 text-sm font-medium" style={{ color: '#5c665f' }}>
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: isActive ? '#e8a33d' : '#c9c2ab' }}
                    aria-hidden="true"
                  />
                  {isActive ? 'Dipilih' : 'Klik untuk memilih'}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 rounded-[10px] border bg-white p-6 shadow-sm sm:p-7" style={{ borderColor: '#ddd6c4', background: '#fffdf8' }}>
          <div className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>Buat Akun</div>
          <p className="mt-1 text-sm" style={{ color: '#5c665f' }}>
            Masukkan email &amp; password untuk menyelesaikan pendaftaran.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleRegister()
            }}
            className="mt-5 space-y-4"
          >
            {errorMessage ? (
              <div role="alert" className="rounded-md border px-4 py-3 text-sm" style={{ background: '#fdf0ec', borderColor: '#b3402e', color: '#7a2418' }}>
                {errorMessage}
              </div>
            ) : null}

            <div>
              <label htmlFor="register-email" className="mb-1 block text-sm font-medium" style={{ color: '#3d4a45' }}>
                Email
              </label>
              <input
                id="register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@usk.ac.id"
                type="email"
                autoComplete="email"
                required
                className="input-base"
              />
            </div>

            <div>
              <label htmlFor="register-password" className="mb-1 block text-sm font-medium" style={{ color: '#3d4a45' }}>
                Password
              </label>
              <input
                id="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                className="input-base"
              />
              <p className="mt-1 text-xs" style={{ color: '#5c665f' }}>
                Minimal 6 karakter — sama dengan aturan backend (sebelumnya
                placeholder menulis 8 karakter, padahal backend menerima 6).
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? 'Memproses...' : 'Daftar & Masuk'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
