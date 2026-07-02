import React, { Suspense, lazy } from 'react'
import App from './App.jsx'
import { QuestionsProvider } from './context/QuestionsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'

// /coz mikro deneme akışı ağır App ağacından (QuestionsProvider, auth, dashboard)
// bağımsız yüklenir — reklam trafiği için en hızlı ilk render.
const PublicQuizFunnel = lazy(() => import('./components/funnel/PublicQuizFunnel.jsx'))

const isPublicQuizRoute =
  typeof window !== 'undefined' && /^\/coz\//i.test(window.location.pathname)

export default function AppRoot() {
  if (isPublicQuizRoute) {
    return (
      <Suspense
        fallback={
          <div className="min-h-dvh bg-slate-950 flex items-center justify-center">
            <div className="h-9 w-9 rounded-full border-2 border-slate-700 border-t-emerald-400 animate-spin" />
          </div>
        }
      >
        <PublicQuizFunnel />
      </Suspense>
    )
  }

  return (
    <ToastProvider>
      <QuestionsProvider>
        <App />
      </QuestionsProvider>
    </ToastProvider>
  )
}
