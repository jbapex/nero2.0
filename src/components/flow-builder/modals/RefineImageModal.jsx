import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import RefineImageForm from '@/components/neurodesign/RefineImageForm';

/**
 * Modal para refinar uma imagem gerada (neurodesign-refine).
 * Se imageUrl for passada: exibe RefineImageForm (região + ações estilo Neuro Designer).
 * Caso contrário: modo simples com apenas campo de instrução.
 * Em sucesso chama onSuccess com a nova imageUrl, runId e imageId.
 */
export default function RefineImageModal({
  open,
  onOpenChange,
  projectId,
  runId,
  imageId,
  imageUrl,
  userAiConnectionId,
  imageConnections = [],
  onSuccess,
}) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSimpleRefine = useCallback(async () => {
    const trimmed = (instruction || '').trim();
    if (!trimmed) {
      toast({ title: 'Digite uma instrução de refino', variant: 'destructive' });
      return;
    }
    if (!projectId || !runId || !imageId) {
      toast({ title: 'Dados da imagem incompletos', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const conn = imageConnections.find((c) => c.id === userAiConnectionId);
      const isGoogle = conn?.provider?.toLowerCase() === 'google';
      const fnName = isGoogle ? 'neurodesign-refine-google' : 'neurodesign-refine';
      const { data, error } = await supabase.functions.invoke(fnName, {
        body: {
          projectId,
          runId,
          imageId,
          instruction: trimmed,
          userAiConnectionId: userAiConnectionId || null,
        },
      });
      const msg = data?.error || error?.message;
      if (error) throw new Error(msg || 'Falha ao chamar o servidor de refino.');
      if (data?.error) throw new Error(data.error);
      const images = data?.images || [];
      if (images.length > 0) {
        const first = images[0];
        const newImageUrl = first.url || first.thumbnail_url;
        const newRunId = data.runId || runId;
        const newImageId = first.id;
        onSuccess?.({ imageUrl: newImageUrl, runId: newRunId, imageId: newImageId, images });
        toast({ title: 'Imagem refinada com sucesso!' });
        onOpenChange?.(false);
        setInstruction('');
      } else {
        toast({ title: 'Nenhuma imagem retornada', variant: 'destructive' });
      }
    } catch (e) {
      toast({ title: 'Erro ao refinar', description: e?.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [instruction, projectId, runId, imageId, userAiConnectionId, imageConnections, onSuccess, onOpenChange, toast]);

  const handleFormRefine = useCallback(
    async (payload) => {
      if (!projectId || !runId || !imageId) {
        toast({ title: 'Dados da imagem incompletos', variant: 'destructive' });
        return;
      }
      setLoading(true);
      try {
        const conn = imageConnections.find((c) => c.id === userAiConnectionId);
        const isGoogle = conn?.provider?.toLowerCase() === 'google';
        const fnName = isGoogle ? 'neurodesign-refine-google' : 'neurodesign-refine';
        const body = {
          projectId,
          runId,
          imageId,
          userAiConnectionId: userAiConnectionId || null,
          ...payload,
        };
        const { data, error } = await supabase.functions.invoke(fnName, { body });
        const msg = data?.error || error?.message;
        if (error) throw new Error(msg || 'Falha ao chamar o servidor de refino.');
        if (data?.error) throw new Error(data.error);
        const images = data?.images || [];
        if (images.length > 0) {
          const first = images[0];
          const newImageUrl = first.url || first.thumbnail_url;
          const newRunId = data.runId || runId;
          const newImageId = first.id;
          onSuccess?.({ imageUrl: newImageUrl, runId: newRunId, imageId: newImageId, images });
          toast({ title: 'Imagem refinada com sucesso!' });
          onOpenChange?.(false);
        } else {
          toast({ title: 'Nenhuma imagem retornada', variant: 'destructive' });
        }
      } catch (e) {
        toast({ title: 'Erro ao refinar', description: e?.message || 'Tente novamente.', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    },
    [projectId, runId, imageId, userAiConnectionId, imageConnections, onSuccess, onOpenChange, toast]
  );

  const useFullForm = Boolean(imageUrl && projectId && user?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={useFullForm ? 'max-w-4xl max-h-[90vh] overflow-y-auto' : 'max-w-md'}>
        <DialogHeader>
          <DialogTitle>Refinar imagem</DialogTitle>
        </DialogHeader>
        {useFullForm ? (
          <RefineImageForm
            imageUrl={imageUrl}
            projectId={projectId}
            user={user}
            onRefine={handleFormRefine}
            disabled={loading}
            compact
            hasImageConnection={Boolean(userAiConnectionId)}
          />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Descreva o ajuste desejado (ex.: deixe o fundo mais escuro, adicione o logo no canto). A nova imagem substituirá a atual.
            </p>
            <div className="space-y-2">
              <Label htmlFor="refine-instruction">Instrução</Label>
              <Textarea
                id="refine-instruction"
                placeholder="Ex.: deixe o fundo mais escuro"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                className="min-h-[80px] resize-y"
                disabled={loading}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSimpleRefine} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Refinar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
