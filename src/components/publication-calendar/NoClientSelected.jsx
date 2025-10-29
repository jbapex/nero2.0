import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

const NoClientSelected = ({ navigate }) => {
  return (
    <div className="text-center py-20">
      <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">Nenhum cliente selecionado</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Por favor, selecione um cliente acima para visualizar o calendário.
      </p>
      <Button className="mt-4" onClick={() => navigate('/clientes')}>
        Adicionar Novo Cliente
      </Button>
    </div>
  );
};

export default NoClientSelected;