
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// FIX: Protocolo SRE para captura de falhas em ambiente de produção (VPS)
interface ErrorBoundaryProps { children?: any; }
interface ErrorBoundaryState { hasError: boolean; error: any; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any) { 
    return { hasError: true, error }; 
  }
  
  componentDidCatch(error: any, info: any) { 
    console.error("SRE CRITICAL CRASH:", error, info); 
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px', background: '#020617', color: 'white', height: '100vh', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: '#ef4444', padding: '20px', borderRadius: '20px', marginBottom: '30px' }}>
             <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.05em' }}>FALHA DE KERNEL S.I.E</h1>
          </div>
          <p style={{ color: '#94a3b8', maxWidth: '600px', lineHeight: '1.6' }}>
            Ocorreu uma exceção não tratada no módulo de renderização. 
            Isso pode ser causado por inconsistência no cache da VPS ou falha de interop em bibliotecas externas.
          </p>
          <pre style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px', color: '#f87171', fontSize: '12px', overflow: 'auto', maxWidth: '90%' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }} 
            style={{ marginTop: '30px', padding: '15px 40px', background: '#4f46e5', border: 'none', color: 'white', borderRadius: '15px', cursor: 'pointer', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Reiniciar Módulo & Limpar Cache
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
