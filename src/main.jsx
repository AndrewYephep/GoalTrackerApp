import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './css/styles.css'
import './css/dark-mode.css'
import { AuthProvider } from './AuthContext'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
) 