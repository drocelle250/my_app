import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-xl border border-red-100 p-10 max-w-md w-full text-center animate-scale-in">
            <div className="text-6xl mb-4">💥</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              An unexpected error occurred. Please refresh the page or go back to the home page.
            </p>
            {this.state.error && (
              <details className="text-left mb-6">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 mb-2">
                  Technical details
                </summary>
                <pre className="text-xs bg-gray-50 border border-gray-200 rounded-xl p-3 overflow-auto text-red-600 max-h-32">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
              >
                🔄 Refresh Page
              </button>
              <button
                onClick={() => { window.location.href = "/"; }}
                className="btn-secondary"
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
