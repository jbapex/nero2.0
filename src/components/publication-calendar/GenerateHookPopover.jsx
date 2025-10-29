import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

const GenerateHookPopover = ({ day, dateKey, isDayGenerating, popoverOpen, setPopoverOpen, campaigns, hookGeneratorModuleId, selectedClientId, setGeneratingDays, setHooks }) => {
  const { toast } = useToast();
  const [campaignId, setCampaignId] = useState('none');

  const handleGenerate = async () => {
    if (!hookGeneratorModuleId) {
      toast({ title: 'Erro', description: 'O módulo gerador de ganchos não está configurado.', variant: 'destructive' });
      return;
    }

    setGeneratingDays(prev => ({ ...prev, [dateKey]: true }));
    setPopoverOpen(false);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          module_id: hookGeneratorModuleId,
          client_id: selectedClientId,
          campaign_id: campaignId === 'none' ? null : campaignId,
          user_text: `Gere um gancho de publicação para o dia ${dateKey}`,
        }
      });

      if (error) throw error;

      const { generatedText } = data;
      const { data: userResponse } = await supabase.auth.getUser();
      const { error: upsertError } = await supabase
        .from('publication_hooks')
        .upsert({
          client_id: selectedClientId,
          user_id: userResponse.user.id,
          campaign_id: campaignId === 'none' ? null : campaignId,
          hook_date: dateKey,
          hook_text: generatedText,
        }, { onConflict: 'client_id,hook_date' });

      if (upsertError) throw upsertError;

      setHooks(prev => ({ ...prev, [dateKey]: generatedText }));
      toast({ title: 'Sucesso!', description: `Gancho gerado para ${format(day, 'dd/MM/yyyy')}.` });

    } catch (error) {
      const errorMessage = error.context?.json ? (await error.context.json()).error : error.message;
      toast({
        title: 'Erro ao gerar gancho',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setGeneratingDays(prev => ({ ...prev, [dateKey]: false }));
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={isDayGenerating || !hookGeneratorModuleId}
          onClick={(e) => e.stopPropagation()}
        >
          {isDayGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-amber-400" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-2">
          <Label htmlFor={`campaign-select-${dateKey}`} className="text-xs font-medium">Campanha (Opcional)</Label>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger id={`campaign-select-${dateKey}`} className="h-8 text-xs">
              <SelectValue placeholder="Nenhuma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {campaigns.map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id.toString()}>{campaign.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="w-full h-8 text-xs" onClick={handleGenerate}>Gerar</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default GenerateHookPopover;