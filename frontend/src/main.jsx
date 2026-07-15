import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LogDashboard from './components/LogDashboard.jsx' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* 1. Main Project Root (renders your existing App component) */}
        <Route path="/" element={<App />} />
        {/* 2. Isolated Logs Route */}
        {/* <Route path="/logs" element={<LogDashboard />} /> */}
        {/* 3. Catch-all: Redirect any other unmapped route to the homepage */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)