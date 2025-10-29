import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet';

import CalendarHeader from '@/components/publication-calendar/CalendarHeader';
import CalendarGrid from '@/components/publication-calendar/CalendarGrid';
import HookDetailsModal from '@/components/publication-calendar/HookDetailsModal';
import NoClientSelected from '@/components/publication-calendar/NoClientSelected';

const PublicationCalendar = () => {
  const navigate = useNavigate();
  const { clientId } = useParams();
  const { toast } = useToast();

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [hooks, setHooks] = useState({});
  const [campaigns, setCampaigns] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [generatingDays, setGeneratingDays] = useState({});
  const [hookGeneratorModuleId, setHookGeneratorModuleId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHook, setSelectedHook] = useState({ day: null, text: '' });
  const [editedHookText, setEditedHookText] = useState('');

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase.from('clients').select('id, name').order('name');
    if (error) {
      toast({ title: 'Erro ao buscar clientes', description: error.message, variant: 'destructive' });
      return [];
    }
    setClients(data);
    return data;
  }, [toast]);

  const fetchCampaigns = useCallback(async () => {
    if (!selectedClientId) return;
    const { data, error } = await supabase.from('campaigns').select('id, name').eq('client_id', selectedClientId);
    if (error) {
      toast({ title: 'Erro ao buscar campanhas', description: error.message, variant: 'destructive' });
    } else {
      setCampaigns(data);
    }
  }, [selectedClientId, toast]);

  const fetchHooks = useCallback(async () => {
    if (!selectedClientId) {
      setHooks({});
      return;
    }
    const { start, end } = getMonthBoundaries(currentMonth);
    const { data, error } = await supabase
      .from('publication_hooks')
      .select('hook_date, hook_text')
      .eq('client_id', selectedClientId)
      .gte('hook_date', start)
      .lte('hook_date', end);

    if (error) {
      toast({ title: 'Erro ao buscar ganchos', description: error.message, variant: 'destructive' });
      return;
    }
    setHooks(data.reduce((acc, hook) => ({ ...acc, [hook.hook_date]: hook.hook_text }), {}));
  }, [selectedClientId, currentMonth, toast]);

  useEffect(() => {
    setIsLoading(true);
    const fetchInitialData = async () => {
      const fetchedClients = await fetchClients();
      if (clientId && fetchedClients.some(c => c.id.toString() === clientId)) {
        setSelectedClientId(clientId);
      } else if (fetchedClients.length > 0) {
        setSelectedClientId(fetchedClients[0].id.toString());
      }

      const { data, error } = await supabase.from('modules').select('id').eq('name', 'Gerador de Ganchos para Calendário').single();
      if (error) {
        toast({ title: 'Erro de Configuração', description: 'Módulo gerador de ganchos não encontrado.', variant: 'destructive' });
      } else {
        setHookGeneratorModuleId(data.id);
      }
      setIsLoading(false);
    };
    fetchInitialData();
  }, [fetchClients, toast, clientId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchCampaigns();
      fetchHooks();
    }
  }, [selectedClientId, currentMonth, fetchCampaigns, fetchHooks]);

  const getMonthBoundaries = (date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  };

  const handleSetSelectedClientId = (id) => {
    setSelectedClientId(id);
    navigate(`/ferramentas/calendario-de-publicacao/${id}`, { replace: true });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-16 h-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Calendário de Publicação - Neuro Ápice</title>
        <meta name="description" content="Planeje e visualize seu conteúdo com o Calendário de Publicação." />
      </Helmet>
      <div className="p-4 sm:p-6 lg:p-8">
        <CalendarHeader
          clients={clients}
          selectedClientId={selectedClientId}
          setSelectedClientId={handleSetSelectedClientId}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
        />

        {!selectedClientId ? (
          <NoClientSelected navigate={navigate} />
        ) : (
          <CalendarGrid
            currentMonth={currentMonth}
            hooks={hooks}
            generatingDays={generatingDays}
            campaigns={campaigns}
            hookGeneratorModuleId={hookGeneratorModuleId}
            selectedClientId={selectedClientId}
            setGeneratingDays={setGeneratingDays}
            setHooks={setHooks}
            setSelectedHook={setSelectedHook}
            setEditedHookText={setEditedHookText}
            setIsModalOpen={setIsModalOpen}
          />
        )}
      </div>

      <HookDetailsModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        selectedHook={selectedHook}
        editedHookText={editedHookText}
        setEditedHookText={setEditedHookText}
        selectedClientId={selectedClientId}
        setHooks={setHooks}
        hooks={hooks}
      />
    </>
  );
};

export default PublicationCalendar;