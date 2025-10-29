import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, BrainCircuit, Eye, Link, Unlink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import StepCard from '@/components/strategic-planner/StepCard';

const PlanningStep = ({ data, updateData }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [plannings, setPlannings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlanning, setSelectedPlanning] = useState(null);
  const [planningSteps, setPlanningSteps] = useState({});

  useEffect(() => {
    const fetchPlannings = async () => {
      if (!user || !data.client_id) {
        setPlannings([]);
        return;
      }
      setLoading(true);
      const { data: planningsData, error } = await supabase
        .from('plannings')
        .select('*')
        .eq('user_id', user.id)
        .eq('client_id', data.client_id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({ title: 'Erro ao buscar planejamentos', description: error.message, variant: 'destructive' });
      } else {
        setPlannings(planningsData);
      }
      setLoading(false);
    };

    fetchPlannings();
  }, [user, data.client_id, toast]);
  
  useEffect(() => {
    const fetchLinkedPlanning = async () => {
        if (data.strategic_planning_id) {
            const { data: planningData, error } = await supabase
                .from('plannings')
                .select('*')
                .eq('id', data.strategic_planning_id)
                .single();
            
            if (error) {
                console.warn('Erro ao buscar planejamento vinculado:', error.message);
                updateData('strategic_planning_id', null);
            } else {
                setSelectedPlanning(planningData);
                const { data: stepsData, error: stepsError } = await supabase.from('planning_steps').select('*').eq('planning_id', planningData.id);
                if(stepsError) console.warn("Erro ao buscar etapas:", stepsError.message);
                else {
                    setPlanningSteps(stepsData.reduce((acc, step) => { acc[step.step] = step; return acc; }, {}));
                }
            }
        } else {
            setSelectedPlanning(null);
            setPlanningSteps({});
        }
    };
    fetchLinkedPlanning();
  }, [data.strategic_planning_id, updateData]);

  const handleLinkPlanning = (planningId) => {
    updateData('strategic_planning_id', planningId);
    toast({ title: 'Planejamento Vinculado!', description: 'O planejamento foi conectado a esta campanha.' });
  };

  const handleUnlinkPlanning = () => {
    updateData('strategic_planning_id', null);
    toast({ title: 'Planejamento Desvinculado!' });
  };
  
  const handleViewPlanning = async (planning) => {
     setSelectedPlanning(planning);
     const { data: stepsData, error } = await supabase.from('planning_steps').select('*').eq('planning_id', planning.id);
     if (error) toast({ title: 'Erro ao carregar etapas', variant: 'destructive'});
     else {
        setPlanningSteps(stepsData.reduce((acc, step) => { acc[step.step] = step; return acc; }, {}));
     }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Planejamento Estratégico</CardTitle>
          <CardDescription>
            Vincule um planejamento estratégico existente para dar mais contexto para a IA.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-24">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : plannings.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">
                {data.client_id ? 'Nenhum planejamento encontrado para este cliente.' : 'Selecione um cliente no passo "Briefing" para ver os planejamentos.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {plannings.map(planning => (
                <div key={planning.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-semibold">Planejamento v{planning.version} ({planning.month}/{planning.year})</p>
                    <p className="text-sm text-muted-foreground">
                      Criado em: {new Date(planning.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                       <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleViewPlanning(planning)}>
                             <Eye className="w-4 h-4" />
                          </Button>
                       </DialogTrigger>
                       <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                             <DialogTitle>Visualizar Planejamento v{planning.version}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            {Object.values(planningSteps).length > 0 ? (
                                Object.values(planningSteps).map(stepData => (
                                    <div key={stepData.id}>
                                       <StepCard 
                                         step={stepData.step} 
                                         title={stepData.step} 
                                         initialData={stepData}
                                         isEnabled={true}
                                         onUpdate={()=>{}}
                                         context={{}}
                                        />
                                    </div>
                                ))
                            ) : <p>Nenhuma etapa encontrada para este planejamento.</p>}
                          </div>
                       </DialogContent>
                    </Dialog>
                    {data.strategic_planning_id === planning.id ? (
                      <Button variant="destructive" size="sm" onClick={handleUnlinkPlanning}>
                        <Unlink className="w-4 h-4 mr-2" /> Desvincular
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => handleLinkPlanning(planning.id)}>
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
      {selectedPlanning && (
        <Card className="mt-6 border-primary bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <BrainCircuit className="w-5 h-5"/> Planejamento Vinculado
                </CardTitle>
                <CardDescription>
                    Este é o planejamento que será usado como referência pela IA.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.values(planningSteps).map(stepData => (
                    <div key={stepData.id}>
                        <StepCard 
                            step={stepData.step} 
                            title={stepData.step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                            initialData={stepData}
                            isEnabled={true}
                            onUpdate={()=>{}}
                            context={{}}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlanningStep;