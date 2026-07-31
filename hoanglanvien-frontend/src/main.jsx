import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // DÒNG NÀY CỰC KỲ QUAN TRỌNG
import { HelmetProvider } from 'react-helmet-async';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
   <HelmetProvider>    {/* 2. Bọc toàn bộ App lại */}
      <App />
    </HelmetProvider>
  </React.StrictMode>,
)