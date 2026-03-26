import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorId: string
  retryCount: number
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // exponential backoff

/** Generate a short crash ID from error message for support */
function generateCrashId(error: Error): string {
  const str = `${error.name}:${error.message}:${error.stack?.slice(0, 200) ?? ''}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0 // Convert to 32bit int
  }
  return `BCN-${Math.abs(hash).toString(36).toUpperCase().slice(0, 8)}`
}

export class ErrorBoundary extends Component<Props, State> {
  private retryTimer: ReturnType<typeof setTimeout> | null = null

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorId: '', retryCount: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: generateCrashId(error),
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo)

    // v3: Structured telemetry via custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('beacon:error', {
        detail: {
          errorId: this.state.errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: Date.now(),
          url: window.location.href,
        }
      }))

      // Sentry integration (if present)
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, { extra: errorInfo })
      }
    }

    // v3: Auto-retry with exponential backoff
    if (this.state.retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[this.state.retryCount] ?? 4000
      this.retryTimer = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          errorId: '',
          retryCount: prev.retryCount + 1,
        }))
      }, delay)
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) clearTimeout(this.retryTimer)
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorId: '', retryCount: 0 })
  }

  private handleCopyError = () => {
    const { error, errorId } = this.state
    const text = [
      `Crash ID: ${errorId}`,
      `Error: ${error?.name}: ${error?.message}`,
      `URL: ${window.location.href}`,
      `Time: ${new Date().toISOString()}`,
      `Stack: ${error?.stack?.slice(0, 500) ?? 'N/A'}`,
    ].join('\n')

    navigator.clipboard.writeText(text).catch(() => {})
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      const isRetrying = this.state.retryCount < MAX_RETRIES

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          textAlign: 'center',
          background: 'var(--bg-primary, #09090b)',
          color: 'var(--text-primary, #f2f3f5)',
          fontFamily: 'var(--font-family, system-ui, sans-serif)',
          gap: '1rem',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-full, 50%)',
            background: 'var(--status-error, var(--status-error))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            opacity: 0.9,
          }}>
            ⚠
          </div>

          <h1 style={{
            fontSize: 'var(--font-size-2xl, 1.5rem)',
            fontWeight: 700,
            margin: '0.5rem 0',
          }}>
            Something went wrong
          </h1>

          <p style={{
            color: 'var(--text-muted, #80848e)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            maxWidth: '400px',
            lineHeight: 1.5,
          }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>

          {isRetrying && (
            <p style={{
              color: 'var(--status-warning, #f0b232)',
              fontSize: 'var(--font-size-xs, 0.75rem)',
            }}>
              Auto-retrying... (attempt {this.state.retryCount + 1}/{MAX_RETRIES})
            </p>
          )}

          <code style={{
            fontSize: 'var(--font-size-xs, 0.75rem)',
            color: 'var(--text-muted, #80848e)',
            background: 'var(--bg-secondary, #0f0f12)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm, 8px)',
            fontFamily: 'var(--font-mono, monospace)',
            userSelect: 'all',
          }}>
            Crash ID: {this.state.errorId}
          </code>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'var(--beacon-brand, var(--beacon-brand))',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-lg, 12px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 600,
                transition: 'background 0.15s ease, transform 0.1s ease',
              }}
            >
              Try Again
            </button>

            <button
              onClick={this.handleCopyError}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'var(--bg-surface-soft, #1c1c21)',
                color: 'var(--text-secondary, #b5bac1)',
                border: '1px solid var(--border-soft, rgba(255,255,255,0.1))',
                borderRadius: 'var(--radius-lg, 12px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 500,
                transition: 'background 0.15s ease, transform 0.1s ease',
              }}
            >
              Copy Error Details
            </button>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.625rem 1.25rem',
                background: 'transparent',
                color: 'var(--text-muted, #80848e)',
                border: '1px solid var(--border-soft, rgba(255,255,255,0.06))',
                borderRadius: 'var(--radius-lg, 12px)',
                cursor: 'pointer',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 500,
                transition: 'background 0.15s ease',
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
