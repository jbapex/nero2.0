import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

class NeuroDesignErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-background text-foreground text-center border border-border rounded-lg">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Algo deu errado no NeuroDesign</h2>
          <p className="text-muted-foreground text-sm mb-4 max-w-md">
            {this.state.error?.message || 'Erro ao carregar a página.'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            Confirme que as tabelas do NeuroDesign foram criadas no Supabase (execute o SQL da migração).
          </p>
          <Button variant="outline" onClick={() => this.setState({ hasError: false, error: null })}>
            Tentar novamente
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default NeuroDesignErrorBoundary;
