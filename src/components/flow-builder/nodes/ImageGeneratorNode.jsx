import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paintbrush, Play, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import NeuroDesignFlowModal from '@/components/flow-builder/modals/NeuroDesignFlowModal';

const ImageGeneratorNode = memo(({ data, id }) => {
  const { onUpdateNodeData, presets, inputData, selectedPresetId, expanded } = data;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastImageUrl, setLastImageUrl] = useState(data.lastImageUrl || null);

  const campaignId = inputData?.campaign?.id;

  const handlePresetChange = (presetId) => {
    onUpdateNodeData(id, { selectedPresetId: presetId });
  };

  const handleGenerateImage = async () => {
    if (!campaignId || !selectedPresetId) {
      toast({ title: 'Atenção', description: 'Conecte uma campanha e selecione um preset.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    setLastImageUrl(null);
    try {
      const preset = presets?.find(p => p.id.toString() === selectedPresetId);
      if (!preset) throw new Error('Preset não encontrado');
      const { data: functionData, error } = await supabase.functions.invoke('image-generator', {
        body: {
          campaign_id: parseInt(campaignId),
          preset_id: parseInt(selectedPresetId),
          ai_connection_id: preset.ai_connection_id,
          ai_model_id: preset.ai_model_id,
          size: preset.tamanho_default || 1024,
          count: 1,
          complemento: `Contexto da Campanha: ${JSON.stringify(inputData.campaign?.data || {})}`,
        },
      });
      if (error) throw new Error(error.message?.includes(':') ? error.message.split(':')[1] : error.message);
      if (functionData?.images?.length > 0) {
        const imageUrl = functionData.images[0].url_publica;
        setLastImageUrl(imageUrl);
        onUpdateNodeData(id, { lastImageUrl: imageUrl, output: { id: functionData.job_id, data: functionData.images } });
        toast({ title: 'Imagem gerada com sucesso!' });
      }
    } catch (e) {
      toast({ title: 'Erro ao gerar imagem', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNeuroDesignResult = (result) => {
    if (!result) return;
    setLastImageUrl(result.lastImageUrl || null);
    onUpdateNodeData(id, { lastImageUrl: result.lastImageUrl, output: result.output });
  };

  const handleCollapse = () => {
    onUpdateNodeData(id, { expanded: false });
  };

  if (expanded) {
    return (
      <Card className="min-w-[920px] w-[920px] border-2 border-pink-500/50 shadow-lg flex flex-col overflow-hidden" style={{ height: '720px' }}>
        <Handle type="target" position={Position.Left} className="!bg-pink-500" />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ minHeight: 0 }}>
          <NeuroDesignFlowModal
            embedded
            onCollapse={handleCollapse}
            inputData={inputData}
            onResult={handleNeuroDesignResult}
          />
        </div>
        <Handle type="source" position={Position.Right} className="!bg-pink-500" />
      </Card>
    );
  }

  return (
    <Card className="w-64 border-2 border-pink-500/50 shadow-lg">
      <Handle type="target" position={Position.Left} className="!bg-pink-500" />
      <CardHeader className="flex-row items-center space-x-2 p-3 bg-pink-500/10">
        <Paintbrush className="w-5 h-5 text-pink-500" />
        <CardTitle className="text-base">Gerador de Imagem</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-3">
        <Button
          onClick={() => onUpdateNodeData(id, { expanded: true })}
          variant="default"
          className="w-full bg-pink-600 hover:bg-pink-700"
        >
          <Paintbrush className="w-4 h-4 mr-2" />
          Configurar e gerar
        </Button>
        <Select onValueChange={handlePresetChange} value={selectedPresetId || ''} disabled={isLoading}>
          <SelectTrigger>
            <SelectValue placeholder="Preset (geração rápida)..." />
          </SelectTrigger>
          <SelectContent>
            {presets?.map((preset) => (
              <SelectItem key={preset.id} value={preset.id.toString()}>
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center overflow-hidden">
          {isLoading ? (
            <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
          ) : lastImageUrl ? (
            <img src={lastImageUrl} alt="Imagem gerada" className="w-full h-full object-cover" />
          ) : (
            <Paintbrush className="w-8 h-8 text-muted-foreground" />
          )}
        </div>
        <Button onClick={handleGenerateImage} disabled={isLoading || !campaignId || !selectedPresetId} variant="outline" className="w-full">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          Gerar rápido (preset)
        </Button>
      </CardContent>
      <Handle type="source" position={Position.Right} className="!bg-pink-500" />
    </Card>
  );
});

export default ImageGeneratorNode;