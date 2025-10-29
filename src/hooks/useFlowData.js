import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

export const useFlowData = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [clients, setClients] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [modules, setModules] = useState([]);
    const [plannings, setPlannings] = useState([]);
    const [analyses, setAnalyses] = useState([]);
    const [presets, setPresets] = useState([]);
    const [knowledgeSources, setKnowledgeSources] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [
                clientsRes, 
                campaignsRes, 
                modulesRes, 
                planningsRes, 
                analysesRes,
                presetsRes,
                knowledgeRes
            ] = await Promise.all([
                supabase.from('clients').select('*').eq('user_id', user.id),
                supabase.from('campaigns').select('*').eq('user_id', user.id),
                supabase.from('modules').select('*').eq('is_active', true),
                supabase.from('plannings').select('*').eq('user_id', user.id),
                supabase.from('campaign_analyses').select('*').eq('user_id', user.id),
                supabase.from('im_presets').select('*'),
                supabase.from('knowledge_sources').select('*').eq('user_id', user.id),
            ]);

            if (clientsRes.error) throw clientsRes.error;
            if (campaignsRes.error) throw campaignsRes.error;
            if (modulesRes.error) throw modulesRes.error;
            if (planningsRes.error) throw planningsRes.error;
            if (analysesRes.error) throw analysesRes.error;
            if (presetsRes.error) throw presetsRes.error;
            if (knowledgeRes.error) throw knowledgeRes.error;

            setClients(clientsRes.data);
            setCampaigns(campaignsRes.data);
            setModules(modulesRes.data);
            setPlannings(planningsRes.data);
            setAnalyses(analysesRes.data);
            setPresets(presetsRes.data);
            setKnowledgeSources(knowledgeRes.data);

        } catch (error) {
            toast({
                title: 'Erro ao carregar dados',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { 
        clients, 
        campaigns, 
        modules, 
        plannings, 
        analyses,
        presets,
        knowledgeSources,
        isLoading, 
        fetchData 
    };
};