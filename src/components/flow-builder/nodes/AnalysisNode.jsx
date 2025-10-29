import React, { memo, useMemo } from 'react';
    import { Handle, Position } from 'reactflow';
    import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { FileSearch } from 'lucide-react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';

    const AnalysisNode = memo(({ data, id }) => {
      const { onUpdateNodeData, inputData, selectedAnalysisId, analyses } = data;
      const { toast } = useToast();

      const clientId = inputData?.client?.id;

      const filteredAnalyses = useMemo(() => {
        if (!analyses) return [];
        if (clientId) {
            const clientName = inputData?.client?.data?.name;
            if (!clientName) return [];
            return analyses.filter(a => a.client_name === clientName);
        }
        return [];
      }, [clientId, inputData, analyses]);

      const handleAnalysisChange = async (analysisId) => {
        try {
            const { data: analysisData, error } = await supabase
                .from('campaign_analyses')
                .select('*')
                .eq('id', analysisId)
                .single();
            if (error) throw error;
        
            onUpdateNodeData(id, {
                selectedAnalysisId: analysisId,
                output: {
                id: analysisId,
                data: analysisData.analysis_data,
                },
            });
        } catch (error) {
           toast({ title: 'Erro ao buscar detalhes da análise', description: error.message, variant: 'destructive' });
        }
      };
      
      const isDisabled = !clientId;
      const placeholderText = isDisabled ? "Conecte um cliente" : (filteredAnalyses.length === 0 ? "Nenhuma análise" : "Selecione uma análise...");

      return (
        <Card className="w-64 border-2 border-orange-500/50 shadow-lg">
          <Handle type="target" position={Position.Left} className="!bg-orange-500" />
          <CardHeader className="flex-row items-center space-x-2 p-3 bg-orange-500/10">
            <FileSearch className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-base">Análise de Campanha</CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <Select onValueChange={handleAnalysisChange} value={selectedAnalysisId} disabled={isDisabled || filteredAnalyses.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={placeholderText} />
              </SelectTrigger>
              <SelectContent>
                {filteredAnalyses.map((analysis) => (
                  <SelectItem key={analysis.id} value={analysis.id.toString()}>
                    {analysis.analysis_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
          <Handle type="source" position={Position.Right} className="!bg-orange-500" />
        </Card>
      );
    });

    export default AnalysisNode;