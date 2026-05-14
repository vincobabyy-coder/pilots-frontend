import { Component, ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Portal ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
          <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="h-11 px-5 rounded-2xl bg-[#C27550] text-white text-sm font-semibold hover:bg-[#A85E3A] transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Try Again
            </button>
            <Link
              to="/"
              className="h-11 px-5 rounded-2xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">home</span>
              Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
