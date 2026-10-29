import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Clean up any legacy dark-mode class from prior prototype versions
if (typeof document !== 'undefined') {
  document.documentElement.classList.remove('dark');
  localStorage.removeItem('theme');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
