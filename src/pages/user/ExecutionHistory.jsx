import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, Trash2, Clipboard, Check, Filter, History, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';

const ExecutionHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [modules, setModules] = useState([]);
  const [filters, setFilters] = useState({ campaignId: 'all', moduleId: 'all' });
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  const fetchInitialData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: historyData, error: historyError } = await supabase
      .from('agent_outputs')
      .select(`
        *,
        campaigns (name),
        modules (name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (historyError) {
      toast({ title: 'Erro ao carregar histórico', description: historyError.message, variant: 'destructive' });
    } else {
      setHistory(historyData);
    }

    const { data: campaignsData, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('user_id', user.id);
    if (!campaignsError) setCampaigns(campaignsData);

    const { data: modulesData, error: modulesError } = await supabase.rpc('get_user_modules');
    if (!modulesError) setModules(modulesData);

    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleToggleFavorite = async (item) => {
    const { data, error } = await supabase
      .from('agent_outputs')
      .update({ is_favorited: !item.is_favorited })
      .eq('id', item.id)
      .select()
      .single();

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível favoritar.', variant: 'destructive' });
    } else {
      setHistory(history.map(h => h.id === item.id ? data : h));
      toast({ title: 'Sucesso!', description: `Item ${data.is_favorited ? 'favoritado' : 'desfavoritado'}.` });
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('agent_outputs').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro ao deletar', description: error.message, variant: 'destructive' });
    } else {
      setHistory(history.filter(h => h.id !== id));
      toast({ title: 'Item deletado com sucesso.' });
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: 'Copiado!', description: 'Conteúdo copiado para a área de transferência.' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const campaignMatch = filters.campaignId === 'all' || item.campaign_id === parseInt(filters.campaignId);
      const moduleMatch = filters.moduleId === 'all' || item.module_id === parseInt(filters.moduleId);
      return campaignMatch && moduleMatch;
    });
  }, [history, filters]);

  const groupedHistory = useMemo(() => {
    const grouped = filteredHistory.reduce((acc, item) => {
      const moduleName = item.modules?.name || 'Módulo Desconhecido';
      if (!acc[moduleName]) {
        acc[moduleName] = [];
      }
      acc[moduleName].push(item);
      return acc;
    }, {});

    Object.keys(grouped).forEach(moduleName => {
      grouped[moduleName] = grouped[moduleName]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
    });

    return grouped;
  }, [filteredHistory]);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold gradient-text mb-2">Histórico de Execuções</h1>
        <p className="text-gray-300">Revise, favorite e gerencie os conteúdos gerados pela IA.</p>
      </motion.div>

      <Card className="glass-effect border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center"><Filter className="w-5 h-5 mr-2" /> Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select value={filters.campaignId} onValueChange={(value) => setFilters(f => ({ ...f, campaignId: value }))}>
            <SelectTrigger className="w-full glass-effect border-white/20 text-white">
              <SelectValue placeholder="Filtrar por campanha..." />
            </SelectTrigger>
            <SelectContent className="glass-effect border-white/20 text-white">
              <SelectItem value="all">Todas as Campanhas</SelectItem>
              {campaigns.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filters.moduleId} onValueChange={(value) => setFilters(f => ({ ...f, moduleId: value }))}>
            <SelectTrigger className="w-full glass-effect border-white/20 text-white">
              <SelectValue placeholder="Filtrar por módulo..." />
            </SelectTrigger>
            <SelectContent className="glass-effect border-white/20 text-white">
              <SelectItem value="all">Todos os Módulos</SelectItem>
              {modules.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : Object.keys(groupedHistory).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(groupedHistory).map(([moduleName, items]) => (
            <div key={moduleName}>
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><Bot className="w-6 h-6 mr-3 text-gray-400"/>{moduleName}</h2>
              <Accordion type="single" collapsible className="w-full glass-effect rounded-lg p-2 border border-white/20">
                {items.map(item => (
                  <AccordionItem value={`item-${item.id}`} key={item.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-4 text-left">
                        <Star className={cn("w-5 h-5 flex-shrink-0", item.is_favorited ? "text-yellow-400 fill-yellow-400" : "text-gray-500")} />
                        <div>
                          <p className="font-semibold text-white">
                            {item.generated_text.substring(0, 80)}{item.generated_text.length > 80 ? '...' : ''}
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            {new Date(item.created_at).toLocaleString('pt-BR')}
                            <span className="mx-2">•</span>
                            Campanha: <span className="font-medium text-gray-300">{item.campaigns?.name || 'N/A'}</span>
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 bg-black/20 rounded-md">
                        <p className="text-gray-200 whitespace-pre-wrap break-words mb-4">{item.generated_text}</p>
                        <div className="flex items-center gap-2 border-t border-white/10 pt-4">
                          <Button variant="ghost" size="sm" onClick={() => handleToggleFavorite(item)} className="text-gray-300 hover:text-white">
                            <Star className={cn("w-4 h-4 mr-2", item.is_favorited ? "text-yellow-400 fill-yellow-400" : "text-gray-400")} />
                            {item.is_favorited ? 'Desfavoritar' : 'Favoritar'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleCopy(item.generated_text, item.id)} className="text-gray-300 hover:text-white">
                            {copiedId === item.id ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Clipboard className="w-4 h-4 mr-2" />}
                            {copiedId === item.id ? 'Copiado!' : 'Copiar'}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <History className="w-16 h-16 mx-auto text-gray-600" />
          <h3 className="mt-4 text-xl font-semibold text-white">Nenhum histórico encontrado</h3>
          <p className="mt-2 text-gray-400">Os conteúdos que você gerar aparecerão aqui. Tente usar um módulo!</p>
        </motion.div>
      )}
    </div>
  );
};

export default ExecutionHistory;