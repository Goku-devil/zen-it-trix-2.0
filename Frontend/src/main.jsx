import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { zenLogo } from './assets/logoDataUrl'

if (typeof document !== 'undefined') {
  const icons = document.querySelectorAll("link[rel*='icon']")
  icons.forEach((el) => { el.href = zenLogo })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
