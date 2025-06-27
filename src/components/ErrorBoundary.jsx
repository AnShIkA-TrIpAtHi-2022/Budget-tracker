import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="max-w-md w-full mx-4 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-left">
                <details>
                  <summary className="cursor-pointer text-gray-700 dark:text-gray-300">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                    {this.state.error?.stack}
                  </pre>
                </details>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
