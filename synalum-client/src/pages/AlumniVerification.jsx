import { useMemo, useState } from 'react' // useState untuk langkah aktif, useMemo untuk data step biar rapi
import { useNavigate } from 'react-router-dom' // Untuk redirect ke dashboard setelah verifikasi
import { useAuth } from '../context/useAuth.js' // Ambil user + markAlumniVerified untuk unlock dashboard alumni
import { api } from '../utils/api.js'
import DemoBanner from '../components/DemoBanner.jsx'

// Verifikasi alumni — 2 langkah yang benar-benar ada di backend:
// 1) OTP email (layer 1), 2) tautan LinkedIn/ijazah (layer 2).
// PERBAIKAN AUDIT (19 Nov 2026):
// - OTP dulu dibandingkan di FRONTEND (bisa dilewati dengan mengubah state
//   React). Sekarang validasi di server via POST /api/verify/confirm-otp.
// - Langkah 3 "Konfirmasi Sesama Alumni" DIHAPUS: inputnya tidak punya state,
//   tidak ada endpoint, dan tombol "Selesai" tidak melakukan apa pun.
//   Layer 3 dicatat sebagai rencana di docs/PRD.md, bukan ditampilkan
//   sebagai fitur yang jalan.
export default function AlumniVerification() {
  const [step, setStep] = useState(1) // Step aktif: 1..2
  const [otpInput, setOtpInput] = useState('') // OTP yang diketik user
  const [issuedOtp, setIssuedOtp] = useState('') // OTP dari server (SIMULASI email terkirim, hanya mode demo)
  const [documentUrl, setDocumentUrl] = useState('') // URL LinkedIn/Ijazah yang diinput user
  const [isSubmitting, setIsSubmitting] = useState(false) // Loading state untuk request API
  const [errorMessage, setErrorMessage] = useState('') // Menyimpan error agar ditampilkan di UI

  const navigate = useNavigate() // Dipakai untuk pindah halaman setelah verifikasi
  const { user, markAlumniVerified } = useAuth() // Kita butuh role + fungsi untuk set status verifikasi (sementara)

  const steps = useMemo(
    () => [
      {
        id: 1,
        title: 'OTP Email',
        description: 'Masukkan kode OTP yang dikirim ke email Anda.',
      },
      {
        id: 2,
        title: 'Unggah LinkedIn / Ijazah',
        description: 'Unggah bukti alumni atau tautan LinkedIn untuk validasi.',
      },
    ],
    [],
  )

  function back() {
    setStep((prev) => Math.max(prev - 1, 1)) // Turun step minimal sampai 1
  }

  const active = steps.find((s) => s.id === step) // Ambil data step yang sedang aktif

  async function handleRequestOtp() {
    // Step 1: minta OTP ke backend (simulasi email terkirim)
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await api.post('/api/verify/request-otp')
      // Server hanya mengembalikan `otp` dalam mode demo (SYNALUM_OTP_DEMO=1
      // atau mock demo). Di produksi field ini tidak ada — user membaca
      // kode dari email sungguhan.
      setIssuedOtp(String(response.data?.otp || ''))
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        'Gagal meminta OTP. Pastikan Anda login sebagai alumni dan server aktif.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleValidateOtp() {
    // Step 1: validasi OTP DI SERVER (POST /api/verify/confirm-otp).
    setErrorMessage('')
    if (!otpInput.trim()) {
      setErrorMessage('Masukkan kode OTP dulu.')
      return
    }
    setIsSubmitting(true)
    try {
      await api.post('/api/verify/confirm-otp', { otp: otpInput.trim() })
      setStep(2) // OTP cocok menurut server → lanjut ke step 2
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        'Gagal memverifikasi OTP. Pastikan Anda login sebagai alumni dan server aktif.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSubmitDocs() {
    // Step 2: submit URL LinkedIn/Ijazah ke backend untuk layer 2
    setErrorMessage('')
    if (!documentUrl.trim()) {
      setErrorMessage('URL LinkedIn/Ijazah wajib diisi.')
      return
    }

    setIsSubmitting(true)
    try {
      await api.post('/api/verify/submit-docs', {
        documentUrl: documentUrl.trim(),
      })

      // Untuk testing prototipe MVP:
      // Setelah submit dokumen sukses, kita tandai alumniVerified=true agar ProtectedRoute mengizinkan masuk dashboard.
      markAlumniVerified(true)

      navigate('/dashboard/alumni', { replace: true }) // Coba masuk ke dashboard alumni
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        'Gagal submit dokumen. Pastikan Anda login sebagai alumni dan server aktif.'
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen" style={{ background: '#f6f4ee', color: '#1f2a28' }}>
      <DemoBanner />
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="rule-thick" aria-hidden="true" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>
          Verifikasi Alumni (2 Lapisan)
        </h1>
        <p className="mt-2 text-sm" style={{ color: '#5c665f' }}>
          Verifikasi 2 langkah untuk alumni. Lapisan ke-3 (konfirmasi sesama
          alumni) belum tersedia — lihat docs/PRD.md.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((s) => {
            const isDone = s.id < step
            const isActive = s.id === step

            return (
              <div
                key={s.id}
                className="rounded-[10px] border bg-white p-5 shadow-sm"
                style={{
                  borderColor: isActive ? '#0b5e66' : '#ddd6c4',
                  background: '#fffdf8',
                  boxShadow: isActive ? '0 0 0 2px rgba(11,94,102,0.25)' : undefined,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold" style={{ color: '#0b5e66' }}>
                    Langkah {s.id}
                  </div>
                  <span
                    className="rounded-md px-3 py-1 text-xs font-semibold"
                    style={{
                      background: isDone ? '#e3efe9' : isActive ? '#0b5e66' : '#eeece4',
                      color: isDone ? '#0b5e66' : isActive ? '#fff' : '#5c665f',
                    }}
                  >
                    {isDone ? 'Selesai' : isActive ? 'Aktif' : 'Menunggu'}
                  </span>
                </div>
                <div className="mt-3 text-base font-semibold">{s.title}</div>
                <div className="mt-2 text-sm" style={{ color: '#5c665f' }}>{s.description}</div>
              </div>
            )
          })}
        </div>

        <div className="mt-6 rounded-[10px] border bg-white p-6 shadow-sm" style={{ borderColor: '#ddd6c4', background: '#fffdf8' }}>
          <div className="text-lg font-semibold" style={{ fontFamily: "'Fraunces', Georgia, serif" }}>{active?.title}</div>
          <div className="mt-2 text-sm" style={{ color: '#5c665f' }}>{active?.description}</div>

          {user?.role && user.role !== 'alumni' ? (
            <div role="alert" className="mt-4 rounded-md border px-4 py-3 text-sm" style={{ background: '#fdf0ec', borderColor: '#b3402e', color: '#7a2418' }}>
              Anda login sebagai <span className="font-semibold">{user.role}</span>. Halaman ini khusus untuk alumni.
            </div>
          ) : null}

          {errorMessage ? (
            <div role="alert" className="mt-4 rounded-md border px-4 py-3 text-sm" style={{ background: '#fdf0ec', borderColor: '#b3402e', color: '#7a2418' }}>
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5">
            {step === 1 && (
              <div className="space-y-3">
                <label htmlFor="verify-otp" className="block text-sm font-medium" style={{ color: '#3d4a45' }}>
                  Kode OTP
                </label>
                <input
                  id="verify-otp"
                  placeholder="Contoh: 123456"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="input-base"
                />

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={isSubmitting}
                    className="btn-ghost"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={handleValidateOtp}
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    Verifikasi OTP
                  </button>
                </div>

                {issuedOtp ? (
                  <div className="rounded-md border px-4 py-3 text-xs" style={{ background: '#fdf3d7', borderColor: '#e8a33d', color: '#5c3d05' }}>
                    Simulasi OTP (mode demo — tidak ada email sungguhan):{' '}
                    <span className="ledger-num font-bold">{issuedOtp}</span>
                  </div>
                ) : null}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <label htmlFor="verify-doc" className="block text-sm font-medium" style={{ color: '#3d4a45' }}>
                  Tautan LinkedIn atau URL Dokumen
                </label>
                <input
                  id="verify-doc"
                  placeholder="https://linkedin.com/in/..."
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  type="url"
                  className="input-base"
                />

                <button
                  type="button"
                  onClick={handleSubmitDocs}
                  disabled={isSubmitting}
                  className="btn-primary w-full"
                >
                  {isSubmitting ? 'Mengirim...' : 'Submit Dokumen'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={back}
              disabled={step === 1}
              className="btn-ghost"
            >
              ← Kembali
            </button>
            <span className="ledger-num text-xs" style={{ color: '#8a938a' }}>
              Langkah {step} dari 2
            </span>
          </div>
        </div>
      </div>
    </main>
  )
}
