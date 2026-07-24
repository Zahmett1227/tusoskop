import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { QuestionsProvider } from './context/QuestionsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { initClarity } from './lib/clarity'
import { captureAcquisitionFromUrl } from './utils/acquisitionAttribution'
import { registerServiceWorker } from './registerServiceWorker'
import { initNativeAppShell } from './utils/nativeApp'
import { isNativePlatform } from './utils/device'

// Failsafe: React hiç mount olmasa bile (ör. Firebase init hatası) native splash
// süresiz asılı kalmasın. initNativeAppShell zaten ilk boyamada hide() çağırıyor;
// bu yalnızca o yol hiç çalışmazsa devreye giren güvenlik ağı.
if (isNativePlatform()) {
  window.setTimeout(() => {
    import('@capacitor/splash-screen')
      .then(({ SplashScreen }) => SplashScreen.hide().catch(() => {}))
      .catch(() => {})
  }, 4000)
}

// Yakalanmayan promise reddi / global hatalar sessizce kaybolmasın.
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    if (import.meta.env.DEV) {
      console.error('[unhandledrejection]', event.reason)
    }
  })
  window.addEventListener('error', (event) => {
    if (import.meta.env.DEV) {
      console.error('[window.error]', event.error || event.message)
    }
  })
}

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
  initNativeAppShell()
  captureAcquisitionFromUrl()
  initClarity()
  registerServiceWorker()
})