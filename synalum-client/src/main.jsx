import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

// HashRouter (bukan BrowserRouter): deploy target adalah Cloudflare Pages
// statis via direct-upload — tidak ada server rewrite, jadi refresh di
// /dashboard/... akan 404 kalau memakai BrowserRouter. Dengan hash,
// semua route tinggal di index.html yang sama. Lihat docs/DEPLOY.md.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </AuthProvider>
  </StrictMode>,
)
