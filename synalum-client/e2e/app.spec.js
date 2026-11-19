/**
 * E2E Synalum — alur nyata melawan build demo (VITE_DEMO_MODE=true).
 * Satu-satunya backend di sini adalah mock di browser (demoApi.js), jadi
 * tes ini membuktikan alur produk end-to-end: daftar → login → verifikasi
 * → posting peluang → lamaran → review.
 *
 * Pelajaran repo #44/#53: jangan pakai getByText untuk teks yang juga
 * muncul di elemen lain — semua asersi di sini memakai getByRole /
 * getByLabel / locator ber-id atau ber-heading.
 */
import { expect, test } from '@playwright/test'

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

async function register(page, role, email, password) {
  await page.goto('/#/register')
  await page.getByRole('radio', { name: role, exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Daftar & Masuk' }).click()
}

test.describe('landing', () => {
  test('menampilkan headline, kartu anggota, dan banner mode demo', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Satu kampus. Tiga jembatan karier.' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Kartu Anggota' })).toBeVisible()
    await expect(page.getByRole('status').first()).toContainText('Mode demo')
    // Statistik vanity tanpa sumber harus TIDAK ada (audit 19 Nov 2026).
    await expect(page.getByText('12K+')).toHaveCount(0)
    await expect(page.getByText('Co-Mentors')).toHaveCount(0)
    // Alur 3 langkah yang memang ada di aplikasi.
    await expect(page.getByText('Daftar sebagai peranmu')).toBeVisible()
    await expect(page.getByText('Alumni diverifikasi')).toBeVisible()
    await expect(page.getByText('Lamar atau posting peluang')).toBeVisible()
  })

  test('tanpa overflow horizontal di mobile', async ({ page }) => {
    await page.goto('/')
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test.describe('alur mahasiswa: daftar → feed → lamar', () => {
  test('feed menampilkan 3 peluang contoh dan lamaran terkirim', async ({ page }) => {
    const id = uid()
    await register(page, 'Mahasiswa', `mhs-${id}@usk.ac.id`, 'rahasia1')
    await expect(page).toHaveURL(/#\/dashboard\/student/)
    await expect(page.getByRole('heading', { name: 'Dashboard Mahasiswa' })).toBeVisible()
    // Angka nyata dari API, bukan "Skor Relevansi 82".
    await expect(page.getByText('Peluang tersedia')).toBeVisible()
    await expect(page.getByText('Skor Relevansi')).toHaveCount(0)
    // 3 peluang contoh dari mock demo.
    await expect(page.getByText('Mentorship Backend — 6 sesi (Contoh)')).toBeVisible()
    await expect(page.getByText('Asisten Riset AI — Lab Informatika USK (Contoh)')).toBeVisible()
    await expect(page.getByText('Magang Frontend — Mitra Kampus (Contoh)')).toBeVisible()

    const firstApply = page.getByRole('button', { name: 'Lamar Sekarang' }).first()
    await firstApply.click()
    await expect(page.getByRole('button', { name: 'Lamaran Terkirim' }).first()).toBeVisible()
    await expect(page.getByRole('status')).toContainText('Lamaran berhasil dikirim.')
  })

  test('login ulang memakai akun yang sama', async ({ page }) => {
    const id = uid()
    const email = `mhs-login-${id}@usk.ac.id`
    await register(page, 'Mahasiswa', email, 'rahasia1')
    await expect(page).toHaveURL(/#\/dashboard\/student/)
    await page.getByRole('button', { name: 'Logout' }).click()
    await expect(page).toHaveURL(/#\/?$/)
    await page.getByLabel('Email', { exact: true }).fill(email)
    await page.getByLabel('Kata Sandi', { exact: true }).fill('rahasia1')
    await page.getByRole('button', { name: 'Masuk ke Dashboard' }).click()
    await expect(page).toHaveURL(/#\/dashboard\/student/)
  })
})

test.describe('alur alumni: daftar → verifikasi OTP → posting peluang', () => {
  test('OTP diverifikasi server-side lalu posting muncul di ringkasan', async ({ page }) => {
    const id = uid()
    await register(page, 'Alumni', `alumni-${id}@usk.ac.id`, 'rahasia1')
    // Alumni belum terverifikasi → dilempar ke halaman verifikasi.
    await expect(page).toHaveURL(/#\/verifikasi-alumni/)
    await expect(page.getByRole('heading', { name: 'Verifikasi Alumni (2 Lapisan)' })).toBeVisible()
    // Langkah 3 yang mati sudah dihapus — hanya ada 2 langkah.
    await expect(page.getByText('Langkah 3')).toHaveCount(0)

    await page.getByRole('button', { name: 'Kirim OTP' }).click()
    await expect(page.getByText(/Simulasi OTP \(mode demo/)).toBeVisible()
    await page.getByLabel('Kode OTP', { exact: true }).fill('123456')
    await page.getByRole('button', { name: 'Verifikasi OTP' }).click()
    await expect(page.getByLabel('Tautan LinkedIn atau URL Dokumen')).toBeVisible()

    await page.getByLabel('Tautan LinkedIn atau URL Dokumen').fill('https://linkedin.com/in/contoh-e2e')
    await page.getByRole('button', { name: 'Submit Dokumen' }).click()
    await expect(page).toHaveURL(/#\/dashboard\/alumni/)
    await expect(page.getByRole('heading', { name: 'Dashboard Alumni' })).toBeVisible()

    await page.getByLabel('Judul Posisi').fill('Mentorship Backend (e2e)')
    await page.getByLabel('Deskripsi').fill('Bimbingan 6 sesi, daring.')
    await page.getByRole('button', { name: 'Posting Peluang' }).click()
    await expect(page.getByText('Peluang berhasil diposting.')).toBeVisible()
    await expect(page.getByText('Mentorship Backend (e2e)')).toBeVisible()
    await expect(page.getByText('Peluang Saya — Ringkasan')).toBeVisible()
  })

  test('OTP salah ditolak', async ({ page }) => {
    const id = uid()
    await register(page, 'Alumni', `alumni-otp-${id}@usk.ac.id`, 'rahasia1')
    await expect(page).toHaveURL(/#\/verifikasi-alumni/)
    await page.getByRole('button', { name: 'Kirim OTP' }).click()
    await page.getByLabel('Kode OTP', { exact: true }).fill('000000')
    await page.getByRole('button', { name: 'Verifikasi OTP' }).click()
    await expect(page.getByRole('alert')).toContainText('OTP tidak cocok')
  })
})

test.describe('alur dosen: posting mendapat badge RESMI USK', () => {
  test('peluang dosen tampil di papan dengan badge resmi', async ({ page }) => {
    const id = uid()
    await register(page, 'Dosen', `dosen-${id}@usk.ac.id`, 'rahasia1')
    await expect(page).toHaveURL(/#\/dashboard\/dosen/)
    await page.getByLabel('Judul Posisi').fill('Asisten Riset AI (e2e)')
    await page.getByLabel('Deskripsi').fill('Lab Informatika USK.')
    await page.getByRole('button', { name: 'Posting Peluang' }).click()
    await expect(page.getByText('Peluang berhasil diposting.')).toBeVisible()
    await expect(page.getByText('Semua Peluang di Papan')).toBeVisible()
    const row = page.locator('div', { hasText: 'Asisten Riset AI (e2e)' }).last()
    await expect(row.getByText('RESMI USK').first()).toBeVisible()
  })
})

test.describe('screenshot README (diambil CI, bukan klaim)', () => {
  test('landing desktop + dashboard mahasiswa', async ({ page }) => {
    test.skip(test.info().project.name !== 'desktop', 'screenshot desktop hanya di proyek desktop')
    await page.goto('/')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e/shots/landing-desktop.png', fullPage: true })
    const id = uid()
    await register(page, 'Mahasiswa', `mhs-shot-${id}@usk.ac.id`, 'rahasia1')
    await expect(page).toHaveURL(/#\/dashboard\/student/)
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e/shots/dashboard-student.png', fullPage: true })
  })

  test('landing mobile', async ({ page }) => {
    test.skip(test.info().project.name !== 'mobile', 'screenshot mobile hanya di proyek mobile')
    await page.goto('/')
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'e2e/shots/landing-mobile.png', fullPage: true })
  })
})
