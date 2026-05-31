import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Wah, ada yang tidak beres!</h2>
            <p className="text-sm text-gray-600">Tenang, sistem sedang memulihkan diri.</p>
            <button 
              className="px-4 py-2 bg-black text-white rounded-full text-sm"
              onClick={() => window.location.reload()}
            >
              Segarkan Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}