import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, FileSearch, Eye, Link2, Link, Unlink } from 'lucide-react';
import AnalysisResults from '@/components/analyzer/AnalysisResults';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const AnalysisStep = ({ data, updateData }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  useEffect(() => {
    const fetchAnalyses = async () => {
      if (!user || !data.client_id) {
        setAnalyses([]);
        return;
      }
      setLoading(true);
      const clientName = data.clients?.name || ''; // Fallback for client name
      const { data: analysesData, error } = await supabase
        .from('campaign_analyses')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_name', clientName)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: 'Erro ao buscar análises', description: error.message, variant: 'destructive' });
      } else {
        setAnalyses(analysesData);
      }
      setLoading(false);
    };

    fetchAnalyses();
  }, [user, data.client_id, data.clients?.name, toast]);
  
  useEffect(() => {
    const fetchLinkedAnalysis = async () => {
        if (data.campaign_analysis_id) {
            const { data: analysisData, error } = await supabase
                .from('campaign_analyses')
                .select('*')
                .eq('id', data.campaign_analysis_id)
                .single();
            
            if (error) {
                console.warn('Erro ao buscar análise vinculada:', error.message);
                updateData('campaign_analysis_id', null);
            } else {
                setSelectedAnalysis(analysisData);
            }
        } else {
            setSelectedAnalysis(null);
        }
    };
    fetchLinkedAnalysis();
  }, [data.campaign_analysis_id, updateData]);

  const handleLinkAnalysis = (analysisId) => {
    updateData('campaign_analysis_id', analysisId);
    toast({ title: 'Análise Vinculada!', description: 'A análise foi conectada a esta campanha.' });
  };

  const handleUnlinkAnalysis = () => {
    updateData('campaign_analysis_id', null);
    toast({ title: 'Análise Desvinculada!' });
  };
  
  const handleViewAnalysis = (analysis) => {
    setSelectedAnalysis(analysis);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análises de Campanhas Anteriores</CardTitle>
          <CardDescription>
            Vincule uma análise de campanha anterior para fornecer mais contexto para a IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                {data.client_id ? 'Nenhuma análise encontrada para este cliente.' : 'Selecione um cliente no passo "Briefing" para ver as análises.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {analyses.map(analysis => (
                <div key={analysis.id} className="flex items-center justify-between p-3 border rounded-lg bg-input">
                  <div>
                    <p className="font-semibold">{analysis.analysis_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Criada em: {new Date(analysis.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                       <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleViewAnalysis(analysis)}>
                             <Eye className="w-4 h-4" />
                          </Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                             <DialogTitle>{analysis.analysis_name}</DialogTitle>
                          </DialogHeader>
                          <AnalysisResults data={analysis.analysis_data} onNewAnalysis={() => {}} />
                       </DialogContent>
                    </Dialog>
                    {data.campaign_analysis_id === analysis.id ? (
                      <Button variant="destructive" size="sm" onClick={handleUnlinkAnalysis}>
                        <Unlink className="w-4 h-4 mr-2" /> Desvincular
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => handleLinkAnalysis(analysis.id)}>
                        <Link className="w-4 h-4 mr-2" /> Vincular
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {selectedAnalysis && (
        <Card className="mt-6 border-primary bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <FileSearch className="w-5 h-5"/> Análise Vinculada
                </CardTitle>
                <CardDescription>
                    Esta é a análise que será usada como referência pela IA.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <AnalysisResults data={selectedAnalysis.analysis_data} onNewAnalysis={() => {}}/>
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisStep;