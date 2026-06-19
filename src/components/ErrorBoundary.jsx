import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary:", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-950 text-white p-6 gap-4 text-center">
          <p className="text-lg font-bold">Beklenmeyen bir hata oluştu</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-white/10 px-5 py-2.5 font-semibold hover:bg-white/15"
          >
            Sayfayı yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
