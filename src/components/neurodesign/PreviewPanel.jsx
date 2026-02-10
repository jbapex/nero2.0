import React, { useState } from 'react';
import { Loader2, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

const isDemoPlaceholder = (url) => url && typeof url === 'string' && url.includes('placehold.co');

const PreviewPanel = ({ selectedImage, images, isGenerating, isRefining, onRefine, onDownload }) => {
  const [refineInstruction, setRefineInstruction] = useState('');
  const imageUrl = selectedImage?.url || selectedImage?.thumbnail_url;
  const isLoading = isGenerating || isRefining;
  const showDemoNotice = !isLoading && imageUrl && isDemoPlaceholder(imageUrl);

  return (
    <div className="flex flex-col h-full p-6">
      <div className="flex-1 min-h-0 rounded-lg border border-white/10 bg-black/20 flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>{isRefining ? 'Refinando...' : 'Gerando...'}</p>
          </div>
        )}
        {!isLoading && !imageUrl && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground text-center px-6">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary/60" />
            </div>
            <p className="font-medium">Aguardando criação</p>
            <p className="text-sm">Configure o builder à esquerda e clique em &quot;Gerar Imagem&quot;.</p>
          </div>
        )}
        {!isLoading && imageUrl && (
          <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
            <img src={imageUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-lg shadow-lg" />
            {showDemoNotice && (
              <div className="mt-3 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-200 text-sm text-center max-w-md">
                Modo demonstração: imagem de exemplo. Selecione uma conexão de imagem (ex.: OpenRouter) no builder para gerar imagens reais.
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => onDownload?.(imageUrl)}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </div>
        )}
      </div>
      {!isLoading && imageUrl && (
        <div className="mt-4 flex gap-2">
          <Textarea
            placeholder="Instrução de ajuste (ex: deixe o fundo mais escuro, adicione um reflexo)"
            value={refineInstruction}
            onChange={(e) => setRefineInstruction(e.target.value)}
            className="flex-1 min-h-[60px] bg-white/5 border-white/20 text-white resize-none"
          />
          <Button onClick={() => { onRefine?.(refineInstruction); setRefineInstruction(''); }} disabled={!refineInstruction.trim()}>
            <Sparkles className="h-4 w-4 mr-1" /> Refinar
          </Button>
        </div>
      )}
    </div>
  );
};

export default PreviewPanel;
