import { db } from '../db.js'

function generateOtp6Digits() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function isOtpDemo() {
  // Default "1": respons request-otp menyertakan kode OTP agar alur bisa
  // dicoba tanpa server email. Set SYNALUM_OTP_DEMO=0 di produksi — OTP
  // tidak pernah dikembalikan ke client.
  return process.env.SYNALUM_OTP_DEMO !== '0'
}

// ─── POST /api/verify/request-otp ───────────────────────────────────────────
export function requestOtp(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const otp = generateOtp6Digits()

    const stmt = db.prepare(`
      INSERT INTO verifications (user_id, otp_code, status, layer_level)
      VALUES (?, ?, 'pending', 1)
    `)
    const result = stmt.run(userId, otp)

    const verification = db.prepare('SELECT id, user_id, status, layer_level, created_at FROM verifications WHERE id = ?').get(result.lastInsertRowid)

    const body = {
      message: 'OTP berhasil dibuat (simulasi email terkirim)',
      verification,
    }
    // OTP hanya dikembalikan dalam mode demo (lihat isOtpDemo di atas).
    if (isOtpDemo()) body.otp = otp
    return res.json(body)
  } catch (error) {
    console.error('[requestOtp]', error)
    return res.status(500).json({ message: 'Gagal membuat OTP' })
  }
}

// ─── POST /api/verify/confirm-otp ──────────────────────────────────────────
// PERBAIKAN AUDIT (19 Nov 2026): sebelumnya OTP hanya dibandingkan di
// FRONTEND (AlumniVerification.jsx menyimpan OTP dari respons lalu
// membandingkannya sendiri) — siapa pun bisa melewati verifikasi dengan
// mengubah state React. Sekarang validasi dilakukan di server terhadap
// baris verifikasi layer-1 terbaru yang masih pending.
export function confirmOtp(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const otp = String(req.body?.otp || '').trim()
    if (!otp) {
      return res.status(400).json({ message: 'otp wajib diisi' })
    }

    const latest = db.prepare(`
      SELECT id, otp_code FROM verifications
      WHERE user_id = ? AND layer_level = 1 AND status = 'pending'
      ORDER BY created_at DESC, id DESC
      LIMIT 1
    `).get(userId)

    if (!latest || latest.otp_code !== otp) {
      return res.status(400).json({ message: 'OTP tidak cocok atau sudah kedaluwarsa. Minta kode baru.' })
    }

    db.prepare(`UPDATE verifications SET status = 'approved' WHERE id = ?`).run(latest.id)
    const verification = db.prepare('SELECT id, user_id, status, layer_level, created_at FROM verifications WHERE id = ?').get(latest.id)
    return res.json({ message: 'OTP terverifikasi', verification })
  } catch (error) {
    console.error('[confirmOtp]', error)
    return res.status(500).json({ message: 'Gagal memverifikasi OTP' })
  }
}

// ─── POST /api/verify/submit-docs ───────────────────────────────────────────
export function submitDocs(req, res) {
  try {
    const userId = req.user?.id
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const documentUrl = String(req.body?.documentUrl || req.body?.document_url || '').trim()
    const linkedinUrl = String(req.body?.linkedinUrl || req.body?.linkedin_url || '').trim()
    const finalUrl    = documentUrl || linkedinUrl

    if (!finalUrl) {
      return res.status(400).json({ message: 'documentUrl / linkedinUrl wajib diisi' })
    }

    // Check if layer-2 verification already exists for this user
    const existing = db.prepare(`
      SELECT id FROM verifications
      WHERE user_id = ? AND layer_level = 2
      ORDER BY created_at DESC
      LIMIT 1
    `).get(userId)

    let verificationRow

    if (existing) {
      db.prepare(`
        UPDATE verifications
        SET document_url = ?, status = 'pending_moderator'
        WHERE id = ?
      `).run(finalUrl, existing.id)

      verificationRow = db.prepare('SELECT id, user_id, status, layer_level, document_url, created_at FROM verifications WHERE id = ?').get(existing.id)
    } else {
      const result = db.prepare(`
        INSERT INTO verifications (user_id, document_url, status, layer_level)
        VALUES (?, ?, 'pending_moderator', 2)
      `).run(userId, finalUrl)

      verificationRow = db.prepare('SELECT id, user_id, status, layer_level, document_url, created_at FROM verifications WHERE id = ?').get(result.lastInsertRowid)
    }

    return res.json({
      message: 'Dokumen diterima dan menunggu moderasi',
      verification: verificationRow,
    })
  } catch (error) {
    console.error('[submitDocs]', error)
    return res.status(500).json({ message: 'Gagal submit dokumen' })
  }
}
