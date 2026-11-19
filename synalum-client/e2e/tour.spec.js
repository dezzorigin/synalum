/**
 * Tur video demo — satu alur utuh untuk README (direkam Playwright).
 * Berjalan HANYA di proyek desktop (lihat test.skip di bawah) dengan
 * video: 'on' (di-override lewat config per-file? tidak bisa — video
 * diaktifkan di sini lewat `test.use({ video: 'on' })`).
 * Hasil: test-results/.../*.webm → CI mengubah ke mp4 (ffmpeg) dan
 * mengunggahnya sebagai artifact e2e-media.
 */
import { expect, test } from '@playwright/test'

test.use({ video: 'on' })

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`

test('tur: daftar mahasiswa → feed → lamar → login ulang', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'tur video hanya desktop')
  const id = uid()
  const email = `mhs-tur-${id}@usk.ac.id`

  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Satu kampus. Tiga jembatan karier.' })).toBeVisible()
  await page.waitForTimeout(800)

  await page.getByRole('button', { name: 'Daftar Sekarang' }).first().click()
  await page.getByRole('radio', { name: 'Mahasiswa', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Password', { exact: true }).fill('rahasia1')
  await page.getByRole('button', { name: 'Daftar & Masuk' }).click()
  await expect(page).toHaveURL(/#\/dashboard\/student/)
  await page.waitForTimeout(800)

  await page.getByRole('button', { name: 'Lamar Sekarang' }).first().click()
  await expect(page.getByRole('button', { name: 'Lamaran Terkirim' }).first()).toBeVisible()
  await page.waitForTimeout(800)

  await page.getByRole('button', { name: 'Logout' }).click()
  await expect(page).toHaveURL(/#\/?$/)
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Kata Sandi', { exact: true }).fill('rahasia1')
  await page.getByRole('button', { name: 'Masuk ke Dashboard' }).click()
  await expect(page).toHaveURL(/#\/dashboard\/student/)
  await page.waitForTimeout(800)
})
