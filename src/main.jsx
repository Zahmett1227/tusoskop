import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { QuestionsProvider } from './context/QuestionsContext.jsx'
import { initClarity } from './lib/clarity'
import { registerServiceWorker } from './registerServiceWorker'

initClarity()
registerServiceWorker()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QuestionsProvider>
        <App />
      </QuestionsProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
