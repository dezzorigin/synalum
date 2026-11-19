import { useEffect, useState } from 'react' // useEffect untuk fetch saat mount, useState untuk simpan data
import { useNavigate } from 'react-router-dom' // Untuk redirect setelah logout
import { useAuth } from '../../context/useAuth.js' // Ambil data user & logout dari context
import { api } from '../../utils/api.js'
import DemoBanner from '../../components/DemoBanner.jsx'

export default function StudentDashboard() {
  const { user, logout } = useAuth() // user.role dipakai untuk validasi route, logout untuk keluar
  const navigate = useNavigate() // Dipakai untuk kembali ke landing page saat logout
  const [opportunities, setOpportunities] = useState([]) // List lowongan dari API
  const [isLoading, setIsLoading] = useState(true) // Loading state saat fetch
  const [errorMessage, setErrorMessage] = useState('') // Pesan error jika fetch gagal
  const [notice, setNotice] = useState('') // Pesan sukses/gagal lamaran (inline, bukan alert)
  const [appliedIds, setAppliedIds] = useState(() => new Set()) // Id peluang yang sudah dilamar di sesi ini
  const [applyingId, setApplyingId] = useState(null) // Menyimpan id peluang yang sedang dilamar (biar tombol bisa loading)

  useEffect(() => {
    // Saat komponen pertama kali tampil, kita fetch daftar peluang dari backend
    // Catatan: axios sudah otomatis membawa JWT dari AuthContext (Authorization header)
    let isCancelled = false // Flag kecil untuk mencegah setState setelah unmount

    async function loadOpportunities() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await api.get('/api/opportunities/all')
        if (!isCancelled) {
          setOpportunities(response.data?.opportunities || [])
        }
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          'Gagal mengambil feed peluang. Pastikan backend aktif.'
        if (!isCancelled) {
          setErrorMessage(msg)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadOpportunities()

    return () => {
      isCancelled = true
    }
  }, [])

  function renderBadge(badgeSource) {
    // Badge sumber peluang — RESMI_USK menonjol (cap merah), sisanya netral.
    if (badgeSource === 'RESMI_USK') {
      return (
        <span className="rounded-md px-2 py-1 text-xs font-bold text-white" style={{ background: '#b3402e' }}>
          RESMI USK
        </span>
      )
    }

    if (badgeSource === 'ALUMNI_POST') {
      return (
        <span className="rounded-md px-2 py-1 text-xs font-bold" style={{ background: '#e3efe9', color: '#0b5e66' }}>
          ALUMNI
        </span>
      )
    }

    return (
      <span className="rounded-md px-2 py-1 text-xs font-bold" style={{ background: '#eeece4', color: '#5c665f' }}>
        EKSTERNAL
      </span>
    )
  }

  async function handleApply(opportunityId) {
    // Saat mahasiswa klik "Lamar Sekarang", kita hit endpoint backend untuk membuat record applications
    setApplyingId(opportunityId) // Set state agar UI bisa menampilkan loading untuk card ini
    setNotice('')
    try {
      await api.post('/api/applications/apply', {
        opportunity_id: opportunityId, // Backend menerima opportunity_id (atau opportunityId)
      })
      setAppliedIds((prev) => new Set(prev).add(opportunityId))
      setNotice('Lamaran berhasil dikirim.')
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        'Gagal mengirim lamaran. Pastikan Anda login sebagai mahasiswa.'
      setNotice(msg)
    } finally {
      setApplyingId(null) // Matikan loading setelah request selesai
    }
  }

  function handleLogout() {
    // Logout = hapus token dari context/localStorage, lalu kembalikan user ke halaman Landing Page (/)
    logout()
    navigate('/', { replace: true })
  }

  return (
    <main className="min-h-screen" style={{ background: '#f6f4ee', color: '#1f2a28' }}>
      <DemoBanner />
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="rule-thick" aria-hidden="true" />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
              Dashboard Mahasiswa
            </h1>
            <p className="mt-2 text-sm" style={{ color: '#5c665f' }}>
              Selamat datang, {user?.email}
            </p>
          </div>

          <button type="button" onClick={handleLogout} className="btn-ghost text-sm">
            Logout
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Angka NYATA dari API — menggantikan "Skor Relevansi 82" (dummy). */}
          <div className="rounded-[10px] border bg-white p-6 shadow-sm" style={{ borderColor: '#ddd6c4', background: '#fffdf8' }}>
            <div className="text-sm font-medium" style={{ color: '#5c665f' }}>Peluang tersedia</div>
            <div className="ledger-num mt-2 text-4xl font-bold" style={{ color: '#0b5e66' }}>
              {isLoading ? '—' : opportunities.length}
            </div>
            <div className="mt-2 text-sm" style={{ color: '#5c665f' }}>
              Dari feed API{appliedIds.size > 0 ? ` · ${appliedIds.size} lamaran terkirim sesi ini` : ''}.
            </div>
          </div>

          <div className="rounded-[10px] border bg-white p-6 shadow-sm md:col-span-2" style={{ borderColor: '#ddd6c4', background: '#fffdf8' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
                Feed Peluang Magang / Mentorship
              </div>
              <span className="rounded-md px-2 py-1 text-xs font-bold" style={{ background: '#e3efe9', color: '#0b5e66' }}>
                Live API
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {notice ? (
                <div role="status" className="rounded-md border px-4 py-3 text-sm" style={{ background: '#eef6f0', borderColor: '#0b5e66', color: '#1f2a28' }}>
                  {notice}
                </div>
              ) : null}

              {errorMessage ? (
                <div role="alert" className="rounded-md border px-4 py-3 text-sm" style={{ background: '#fdf0ec', borderColor: '#b3402e', color: '#7a2418' }}>
                  {errorMessage}
                </div>
              ) : null}

              {isLoading ? (
                <div className="rounded-md px-4 py-3 text-sm" style={{ background: '#eeece4', color: '#5c665f' }}>
                  Memuat peluang...
                </div>
              ) : null}

              {!isLoading && !errorMessage && opportunities.length === 0 ? (
                <div className="rounded-md px-4 py-3 text-sm" style={{ background: '#eeece4', color: '#5c665f' }}>
                  Belum ada peluang yang tersedia.
                </div>
              ) : null}

              {!isLoading &&
                !errorMessage &&
                opportunities.map((item, i) => (
                  <article
                    key={item.id}
                    className="rounded-[10px] border bg-white p-4"
                    style={{ borderColor: '#ddd6c4' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <span className="ledger-num text-sm font-bold" style={{ color: '#e8a33d' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div className="text-base font-semibold">{item.title}</div>
                      </div>
                      <span className="flex gap-2">
                        {item.demo_seed ? (
                          <span className="rounded-md px-2 py-1 text-xs font-bold" style={{ background: '#fdf3d7', color: '#5c3d05' }}>
                            Contoh
                          </span>
                        ) : null}
                        {renderBadge(item.badge_source)}
                      </span>
                    </div>
                    {item.description ? (
                      <p className="mt-2 text-sm" style={{ color: '#5c665f' }}>
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <span className="ledger-num text-xs" style={{ color: '#8a938a' }}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleApply(item.id)}
                        disabled={applyingId === item.id || appliedIds.has(item.id)}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        {appliedIds.has(item.id)
                          ? 'Lamaran Terkirim'
                          : applyingId === item.id
                            ? 'Memproses...'
                            : 'Lamar Sekarang'}
                      </button>
                    </div>
                  </article>
                ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
