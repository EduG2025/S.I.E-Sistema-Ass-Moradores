
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// FIX: Use any for ReactNode to bypass namespace export errors
interface ErrorBoundaryProps { children?: any; }
interface ErrorBoundaryState { hasError: boolean; error: any; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Explicitly defined props to avoid 'Property props does not exist' error in some strict environments
  public props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any) { return { hasError: true, error }; }
  componentDidCatch(error: any, info: any) { console.error("SRE CRASH:", error, info); }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', background: '#020617', color: 'white', height: '100vh', fontFamily: 'sans-serif' }}>
          <h1 style={{ color: '#ef4444' }}>FALHA DE KERNEL S.I.E</h1>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', background: '#4f46e5', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>Reiniciar Módulo</button>
        </div>
      );
    }
    // Accessing props via this.props which is now explicitly declared and initialized
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(<ErrorBoundary><App /></ErrorBoundary>);
}