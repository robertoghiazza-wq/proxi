import { Component } from 'react'

interface Props { children: React.ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          padding: '24px 16px', color: 'var(--prox-danger)',
          fontSize: 13, lineHeight: 1.6,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Errore rendering</div>
          <code style={{ fontSize: 12, wordBreak: 'break-all' }}>
            {this.state.error.message}
          </code>
        </div>
      )
    }
    return this.props.children
  }
}
