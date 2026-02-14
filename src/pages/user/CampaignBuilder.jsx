import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, FileText, Share2, BarChart, Bot, CheckCircle, ChevronLeft, ChevronRight, BrainCircuit, FileSearch } from 'lucide-react';
import { cn } from '@/lib/utils';
import BriefingStep from '@/components/campaign-builder/BriefingStep';
import ChannelsStep from '@/components/campaign-builder/ChannelsStep';
import StrategyStep from '@/components/campaign-builder/StrategyStep';
import GenerationStep from '@/components/campaign-builder/GenerationStep';
import PlanningStep from '@/components/campaign-builder/PlanningStep';
import AnalysisStep from '@/components/campaign-builder/AnalysisStep';
import { useValidation } from '@/hooks/useValidation';
import { useDebounce } from '@/hooks/use-debounce';

const steps = [
  { id: 'briefing', name: 'Briefing', icon: FileText, component: BriefingStep, validationRules: { name: { required: true, message: 'O nome da campanha é obrigatório.' }, objective: { required: true, message: 'O objetivo da campanha é obrigatório.' } } },
  { id: 'channels', name: 'Canais', icon: Share2, component: ChannelsStep, validationRules: {} },
  { id: 'strategy', name: 'Estratégia', icon: BarChart, component: StrategyStep, validationRules: {} },
  { id: 'planning', name: 'Planejamento', icon: BrainCircuit, validationRules: {} },
  { id: 'analysis', name: 'Análises', icon: FileSearch, component: AnalysisStep, validationRules: {} },
  { id: 'content', name: 'Conteúdo', icon: Bot, component: GenerationStep, validationRules: {} },
];

const CampaignBuilder = () => {
  const { campaignId: paramCampaignId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [campaignData, setCampaignData] = useState({ name: '', objective: '', channels: [], client_id: null, budget: 0, start_date: '', end_date: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  const [campaignTitle, setCampaignTitle] = useState('Nova Campanha');
  const [currentCampaignId, setCurrentCampaignId] = useState(paramCampaignId);
  const [client, setClient] = useState(null);
  
  const isFirstLoad = useRef(true);
  const debouncedCampaignData = useDebounce(campaignData, 1500);

  const { errors, validate, validateField } = useValidation(steps[0].validationRules);

  const getCleanDataForSave = (data) => {
    const { id, clients, ...rest } = data;
    return { ...rest };
  };
  
  const autoSaveCampaign = useCallback(async (dataToSave) => {
    if (!currentCampaignId || !user) return;
    
    if (!dataToSave.name || !dataToSave.objective) {
      setAutoSaveStatus('');
      return;
    }

    setAutoSaveStatus('Salvando...');
    
    const cleanData = getCleanDataForSave(dataToSave);
    const { error } = await supabase
      .from('campaigns')
      .update({
        ...cleanData,
        workflow_data: { ...dataToSave },
      })
      .eq('id', currentCampaignId);

    if (error) {
      setAutoSaveStatus('Erro ao salvar');
      console.error("Auto-save error:", error);
    } else {
      setAutoSaveStatus('Salvo!');
      setTimeout(() => setAutoSaveStatus(''), 2000);
    }
  }, [currentCampaignId, user]);

  useEffect(() => {
    if (!isFirstLoad.current && currentCampaignId && currentStep === 0) {
      autoSaveCampaign(debouncedCampaignData);
    }
  }, [debouncedCampaignData, currentCampaignId, autoSaveCampaign, currentStep]);

  const fetchCampaign = useCallback(async (id) => {
    if (!id || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*, clients(id, name, client_contexts(name, content))')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      toast({ title: 'Erro', description: 'Campanha não encontrada ou acesso negado.', variant: 'destructive' });
      navigate(`/campanhas`);
    } else {
      const initialData = data.workflow_data || {};
      const mergedData = { ...data, ...initialData };
      if (!mergedData.channels) mergedData.channels = [];
      
      setCampaignData({ ...mergedData, id: data.id, client_id: data.client_id });
      setCampaignTitle(data.name || 'Nova Campanha');
      if (data.clients) {
        setClient(data.clients);
      }
      if (location.state?.directToContent) {
        setCurrentStep(steps.findIndex(step => step.id === 'content'));
      }
    }
    setLoading(false);
  }, [user, navigate, toast, location.state]);

  useEffect(() => {
    if (isFirstLoad.current) {
        isFirstLoad.current = false;
        setCurrentCampaignId(paramCampaignId);
        if (paramCampaignId) {
            fetchCampaign(paramCampaignId);
        } else {
            if (!campaignData.name && !campaignData.objective) {
                setCampaignData({ name: '', objective: '', channels: [], client_id: null, budget: 0, start_date: '', end_date: '' });
                setCampaignTitle('Nova Campanha');
            }
            setCurrentStep(0);
            setLoading(false);
        }
    }
  }, [paramCampaignId, fetchCampaign, campaignData.name, campaignData.objective]);


  useEffect(() => {
    if (campaignData.name) {
      setCampaignTitle(campaignData.name);
    }
  }, [campaignData.name]);
  
  const updateData = useCallback((key, value) => {
    setCampaignData(prev => {
      const newData = { ...prev, [key]: value };
      if (currentStep === 0) {
        validateField(key, value);
      }
      return newData;
    });
  }, [validateField, currentStep]);

  const applyTemplate = useCallback((template) => {
    const marketingData = template.marketing_data || {};
    const newCampaignData = {
      ...campaignData,
      name: `${client?.name || 'Campanha'} - ${template.niche_name}`,
      objective: template.default_briefing,
      target_audience: marketingData.audience?.interests || template.target_audience || '',
      brand_differential: template.brand_differential || '',
      tone_of_voice: marketingData.content?.tone_of_voice || template.tone_of_voice || '',
      channels: marketingData.channels?.distribution || [],
      bidding_strategy: marketingData.channels?.bidding_strategy || '',
      kpis: marketingData.metrics ? `CTR: ${marketingData.metrics.ctr}, CPA: ${marketingData.metrics.cpa}, ROAS: ${marketingData.metrics.roas}` : '',
      personas: marketingData.personas ? JSON.stringify(marketingData.personas, null, 2) : '',
      content_strategy: marketingData.content?.key_messages || '',
    };
    setCampaignData(newCampaignData);
    if (currentStep === 0) {
        validate(newCampaignData);
    }
    toast({
      title: "Template Aplicado!",
      description: `O template "${template.niche_name}" foi carregado.`,
    });
  }, [campaignData, client, toast, validate, currentStep]);
  
  const handleSaveAndProceed = async (proceedAction) => {
    if (!user) return;
    
    setSaving(true);
    setAutoSaveStatus('');
    
    const dataToSave = {
        user_id: user.id,
        client_id: campaignData.client_id,
        name: campaignData.name || 'Campanha Sem Nome',
        objective: campaignData.objective,
        target_audience: campaignData.target_audience,
        brand_differential: campaignData.brand_differential,
        tone_of_voice: campaignData.tone_of_voice,
        channels: campaignData.channels,
        budget: campaignData.budget,
        start_date: campaignData.start_date || null,
        end_date: campaignData.end_date || null,
        bidding_strategy: campaignData.bidding_strategy,
        kpis: campaignData.kpis,
        personas: campaignData.personas,
        content_strategy: campaignData.content_strategy,
        strategic_planning_id: campaignData.strategic_planning_id,
        campaign_analysis_id: campaignData.campaign_analysis_id,
        workflow_data: { ...getCleanDataForSave(campaignData), id: currentCampaignId },
    };

    let campaignIdToUse = currentCampaignId;

    try {
        if (!campaignIdToUse) {
          const { data, error } = await supabase.from('campaigns').insert(dataToSave).select().single();
          if (error) throw error;
          toast({ title: 'Campanha Criada!', description: 'Sua nova campanha foi salva.' });
          campaignIdToUse = data.id;
          setCurrentCampaignId(campaignIdToUse);
          setCampaignData(prev => ({ ...prev, id: campaignIdToUse }));
          navigate(`/campanhas/editar/${campaignIdToUse}`, { replace: true });
        } else {
          const { error } = await supabase.from('campaigns').update(dataToSave).eq('id', campaignIdToUse);
          if (error) throw error;
          if (proceedAction) {
             toast({ title: 'Progresso Salvo!' });
          }
        }
        if(proceedAction) proceedAction();
    } catch(error) {
        toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
        setSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      handleSaveAndProceed(() => setCurrentStep(currentStep + 1));
    } else {
      handleSaveAndProceed(() => {
        toast({ title: "Campanha Finalizada!", description: "Você completou o fluxo de criação."});
        navigate(`/campanhas`);
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:py-6">
      <header className="mb-8">
        <Button variant="ghost" onClick={() => navigate(`/campanhas`)} className="mb-4">
          <ChevronLeft className="w-4 h-4 mr-2" /> Voltar para Campanhas
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{campaignTitle}</h1>
        {client && <p className="text-muted-foreground">Cliente: {client.name}</p>}
        <div className="mt-4">
          <ol className="flex items-center w-full">
            {steps.map((step, index) => (
              <li key={step.id} className={cn("flex w-full items-center", { "after:content-[''] after:w-full after:h-1 after:border-b after:border-4 after:inline-block": index < steps.length - 1, "after:border-primary": index < currentStep, "after:border-border": index >= currentStep })}>
                <button onClick={() => setCurrentStep(index)} disabled={saving || (!currentCampaignId && index > 0)} className={cn("flex items-center justify-center w-10 h-10 rounded-full lg:h-12 lg:w-12 shrink-0 transition-colors", { "bg-primary text-primary-foreground": index <= currentStep, "bg-muted text-muted-foreground": index > currentStep, "cursor-not-allowed opacity-50": !currentCampaignId && index > 0 })}>
                  {index < currentStep ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </header>

      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-full">
              <CardHeader>
                <CardTitle>{steps[currentStep].name}</CardTitle>
                <CardDescription>
                    {steps[currentStep].id === 'briefing' && "Comece preenchendo as informações básicas da sua campanha."}
                    {steps[currentStep].id === 'channels' && "Selecione os canais de marketing e defina suas configurações."}
                    {steps[currentStep].id === 'strategy' && "Defina os detalhes estratégicos para guiar a IA."}
                    {steps[currentStep].id === 'planning' && "Visualize e vincule planejamentos estratégicos existentes para esta campanha."}
                    {steps[currentStep].id === 'analysis' && "Consulte e vincule análises de campanhas anteriores para obter mais insights."}
                    {steps[currentStep].id === 'content' && "Use os agentes de IA para gerar e refinar o conteúdo da sua campanha."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {steps[currentStep].component && (
                  <CurrentStepComponent 
                    data={campaignData}
                    errors={currentStep === 0 ? errors : {}}
                    updateData={updateData} 
                    campaignId={currentCampaignId} 
                    campaignData={{...campaignData, client_name: client?.name, client: client}}
                    applyTemplate={applyTemplate}
                    setClient={setClient}
                    autoSaveStatus={currentCampaignId ? autoSaveStatus : ''}
                  />
                )}
                {!steps[currentStep].component && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">🚧 Este recurso não está implementado ainda—mas não se preocupe! Você pode solicitá-lo em seu próximo prompt! 🚀</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="mt-8 flex justify-between items-center">
        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || saving}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <div className="flex items-center gap-4">
          <Button onClick={handleNext} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {currentStep === steps.length - 1 ? 'Finalizar Campanha' : 'Avançar'}
            {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default CampaignBuilder;