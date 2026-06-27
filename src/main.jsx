import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { QuestionsProvider } from './context/QuestionsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { initClarity } from './lib/clarity'
import { initMetaPixel } from './lib/metaPixel'
import { captureAcquisitionFromUrl } from './utils/acquisitionAttribution'
import { registerServiceWorker } from './registerServiceWorker'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <QuestionsProvider>
          <App />
        </QuestionsProvider>
      </ToastProvider>
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
  captureAcquisitionFromUrl()
  initClarity()
  initMetaPixel()
  registerServiceWorker()
})