if (typeof window !== 'undefined' && window.location.hostname === '127.0.0.1') {
  window.location.replace(`http://localhost:${window.location.port}${window.location.pathname}${window.location.search}${window.location.hash}`)
}
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { QuestionsProvider } from './context/QuestionsContext.jsx'
import { initClarity } from './lib/clarity'
import { registerServiceWorker } from './registerServiceWorker'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QuestionsProvider>
        <App />
      </QuestionsProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

const runAfterFirstPaint = (task) => {
  if (typeof window === 'undefined') return
  window.requestAnimationFrame(() => {
    window.setTimeout(task, 0)
  })
}

runAfterFirstPaint(() => {
  initClarity()
  registerServiceWorker()
})