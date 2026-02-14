import React from 'react';

export class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            padding: 24,
            background: '#111827',
            color: '#f3f4f6',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: 20, marginBottom: 16 }}>Algo deu errado</h1>
          <pre
            style={{
              background: '#1f2937',
              padding: 16,
              borderRadius: 8,
              overflow: 'auto',
              fontSize: 12,
              color: '#fca5a5',
            }}
          >
            {this.state.error?.message ?? String(this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              marginTop: 16,
              padding: '10px 20px',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Recarregar a página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
