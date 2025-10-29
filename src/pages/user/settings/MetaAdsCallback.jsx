import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Facebook } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const MetaAdsCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState('Processando autorização...');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error_description');

    if (error) {
      toast({
        title: 'Erro de Autorização do Facebook',
        description: decodeURIComponent(error),
        variant: 'destructive',
      });
      navigate('/settings/integrations', { replace: true });
      return;
    }

    if (code && state) {
      const handleCallback = async () => {
        setStatus('Validando código e obtendo token de acesso...');
        try {
          const { data, error: functionError } = await supabase.functions.invoke('meta-ads-callback', {
            body: JSON.stringify({ code, state }),
          });

          if (functionError) {
            // Tenta extrair a mensagem de erro da resposta da função
            const errorMessage = functionError.context?.json?.error || functionError.message;
            throw new Error(errorMessage);
          }

          if (data.success) {
            toast({
              title: 'Sucesso!',
              description: 'Sua conta do Meta Ads foi conectada com sucesso.',
              className: 'bg-green-500 text-white',
            });
            navigate('/settings/integrations?success=true', { replace: true });
          } else {
             throw new Error(data.error || 'Ocorreu um erro desconhecido durante a conexão.');
          }

        } catch (e) {
          toast({
            title: 'Erro na Conexão',
            description: e.message || 'Não foi possível finalizar a conexão com o Meta Ads.',
            variant: 'destructive',
          });
          navigate(`/settings/integrations?error=${encodeURIComponent(e.message)}`, { replace: true });
        }
      };

      handleCallback();
    } else {
        toast({
            title: 'Parâmetros inválidos',
            description: 'Código de autorização ou estado ausente no retorno do Facebook.',
            variant: 'destructive',
        });
        navigate('/settings/integrations', { replace: true });
    }
  }, [searchParams, navigate, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="flex items-center gap-4 mb-4">
        <Facebook className="w-12 h-12 text-blue-600" />
        <h1 className="text-2xl font-bold">Finalizando Conexão com Meta Ads</h1>
      </div>
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">{status}</p>
      <p className="text-muted-foreground text-sm mt-2">Você será redirecionado em breve.</p>
    </div>
  );
};

export default MetaAdsCallback;