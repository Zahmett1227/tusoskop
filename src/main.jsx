import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppRoot from './AppRoot.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { initClarity } from './lib/clarity'
import { initMetaPixel } from './lib/metaPixel'
import { captureAcquisitionFromUrl } from './utils/acquisitionAttribution'
import { registerServiceWorker } from './registerServiceWorker'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRoot />
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
  // Landing UTM'lerini yakala — web devam akışında kayıt sonrası acquisition'a yazılır.
  captureAcquisitionFromUrl()
  initClarity()
  initMetaPixel()
  registerServiceWorker()
})
