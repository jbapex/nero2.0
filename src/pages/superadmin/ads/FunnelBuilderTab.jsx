import React from 'react';
import { GitBranch } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const FunnelBuilderTab = () => {
  const { toast } = useToast();

  const handleRequestFeature = () => {
    toast({
      title: '🚧 Funcionalidade em Desenvolvimento',
      description: "Este construtor de funis ainda não foi implementado. Você pode solicitar esta funcionalidade no próximo prompt! 🚀",
      duration: 5000,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><GitBranch className="mr-2" /> Construtor de Funis</CardTitle>
        <CardDescription>Crie e gerencie templates de funis de marketing para suas campanhas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <GitBranch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold">Em Breve</h3>
            <p className="text-muted-foreground mt-2 mb-4">O construtor de funis está a caminho.</p>
            <Button onClick={handleRequestFeature}>Solicitar Implementação</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FunnelBuilderTab;