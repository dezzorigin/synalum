import axios from 'axios'
import { demoAdapter } from './demoApi.js'

// Mode demo: build Pages memakai `VITE_DEMO_MODE=true` — request /api
// dijawab mock di browser (demoApi.js), bukan server Express. Tanpa flag
// ini, perilaku lama berlaku: di development, Vite mem-proxy /api →
// http://localhost:5000; di build non-demo, /api harus dilayani backend
// sendiri (lihat docs/DEPLOY.md — API tidak bisa tinggal di Pages).
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

// In development, Vite proxies /api → http://localhost:5000 automatically.
// Using a relative base URL means no CORS issues and no hard-coded ports in the frontend.
export const api = axios.create({
  baseURL: '/',
  timeout: 10000,
  ...(isDemoMode ? { adapter: demoAdapter } : {}),
})

export function setApiAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common.Authorization
  }
}
