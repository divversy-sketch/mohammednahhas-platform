import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { registerPWAUpdate } from './pwaUpdate.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// PWA auto update system
registerPWAUpdate()
