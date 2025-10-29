import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Bot, Target, Users, GitBranch, LineChart, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdsAgentsTab from '@/pages/superadmin/ads/AdsAgentsTab';
import CampaignTypesTab from '@/pages/superadmin/ads/CampaignTypesTab';
import AudienceBuilderTab from '@/pages/superadmin/ads/AudienceBuilderTab';
import FunnelBuilderTab from '@/pages/superadmin/ads/FunnelBuilderTab';
import StrategyBuilderTab from '@/pages/superadmin/ads/StrategyBuilderTab';
import CampaignAnalyzerTab from '@/pages/superadmin/ads/CampaignAnalyzerTab';

const AdsManagement = () => {
  const [campaignTypes, setCampaignTypes] = useState([]);
  const [nicheTemplates, setNicheTemplates] = useState([]);
  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    const { data: ctData, error: ctError } = await supabase.from('ads_campaign_types').select('id, name');
    if (ctError) toast({ title: 'Erro ao carregar tipos de campanha', variant: 'destructive' });
    else setCampaignTypes(ctData);

    const { data: ntData, error: ntError } = await supabase.from('niche_templates').select('id, niche_name');
    if (ntError) toast({ title: 'Erro ao carregar templates de nicho', variant: 'destructive' });
    else setNicheTemplates(ntData);
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">Módulo: ADS Inteligente</h1>
        <p className="text-sm md:text-base text-muted-foreground">Gerencie os componentes do seu módulo de criação de anúncios.</p>
      </motion.div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-6">
          <TabsTrigger value="agents"><Bot className="w-4 h-4 mr-2" />Agentes</TabsTrigger>
          <TabsTrigger value="campaign_types"><Target className="w-4 h-4 mr-2" />Tipos</TabsTrigger>
          <TabsTrigger value="audience_builder"><Users className="w-4 h-4 mr-2" />Públicos</TabsTrigger>
          <TabsTrigger value="funnel_builder"><GitBranch className="w-4 h-4 mr-2" />Funis</TabsTrigger>
          <TabsTrigger value="strategy_builder"><LineChart className="w-4 h-4 mr-2" />Estratégias</TabsTrigger>
          <TabsTrigger value="campaign_analyzer"><Search className="w-4 h-4 mr-2" />Analisador</TabsTrigger>
        </TabsList>
        <TabsContent value="agents" className="mt-6">
          <AdsAgentsTab campaignTypes={campaignTypes} onDataChange={fetchInitialData} />
        </TabsContent>
        <TabsContent value="campaign_types" className="mt-6">
          <CampaignTypesTab nicheTemplates={nicheTemplates} onDataChange={fetchInitialData} />
        </TabsContent>
        <TabsContent value="audience_builder" className="mt-6">
          <AudienceBuilderTab />
        </TabsContent>
        <TabsContent value="funnel_builder" className="mt-6">
          <FunnelBuilderTab />
        </TabsContent>
        <TabsContent value="strategy_builder" className="mt-6">
          <StrategyBuilderTab />
        </TabsContent>
        <TabsContent value="campaign_analyzer" className="mt-6">
          <CampaignAnalyzerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdsManagement;