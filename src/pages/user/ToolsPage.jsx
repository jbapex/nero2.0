import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ToolsPage = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Ferramentas</h1>
      <p className="text-muted-foreground mt-2">Acesse as ferramentas pelo menu.</p>
      <Button asChild className="mt-4">
        <Link to="/campanhas">Voltar</Link>
      </Button>
    </div>
  );
};

export default ToolsPage;
