import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Target, Briefcase, Filter, X, Bot, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Campaigns = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const fetchClientsAndCampaigns = useCallback(async () => {
    if (!user || authLoading) return;
    setLoading(true);

    const { data: clientsData, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id);

    if (clientsError) {
      toast({ title: 'Erro ao carregar clientes', description: clientsError.message, variant: 'destructive' });
    } else {
      setClients(clientsData || []);
    }

    const { data, error } = await supabase
      .from('campaigns')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar campanhas', description: error.message, variant: 'destructive' });
    } else {
      setCampaigns(data || []);
    }
    setLoading(false);
  }, [user, toast, authLoading]);

  useEffect(() => {
    if (!authLoading) {
      fetchClientsAndCampaigns();
    }
  }, [fetchClientsAndCampaigns, authLoading]);

  const handleDelete = async (campaignId) => {
    try {
      await supabase.from('ads_agent_outputs').delete().eq('campaign_id', campaignId);
      await supabase.from('agent_outputs').delete().eq('campaign_id', campaignId);
      await supabase.from('campaign_chat_sessions').delete().eq('campaign_id', campaignId);

      const { error: campaignError } = await supabase.from('campaigns').delete().eq('id', campaignId);
      if (campaignError) throw campaignError;

      toast({ title: 'Campanha deletada!', description: 'A campanha foi removida com sucesso.' });
      fetchClientsAndCampaigns();
    } catch (error) {
      toast({ title: 'Erro ao deletar campanha', description: `Não foi possível remover a campanha. ${error.message}`, variant: 'destructive' });
    }
  };

  const handleFilterChange = (clientId) => {
    setFilteredClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const handleGoToContent = (campaignId) => {
    navigate(`/campanhas/editar/${campaignId}`, { state: { directToContent: true } });
  };

  const displayedCampaigns = filteredClients.size > 0
    ? campaigns.filter(c => filteredClients.has(c.client_id))
    : campaigns;

  if (loading || authLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-center md:text-left">
          <div className="w-full">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Campanhas</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Visualize, gerencie e crie novas campanhas.</p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-center">
            {clients.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 text-sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                    {filteredClients.size > 0 && <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">{filteredClients.size}</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Clientes</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {clients.map(client => (
                    <DropdownMenuCheckboxItem key={client.id} checked={filteredClients.has(client.id)} onCheckedChange={() => handleFilterChange(client.id)}>
                      {client.name}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {filteredClients.size > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => setFilteredClients(new Set())}>
                        <X className="w-4 h-4 mr-2" /> Limpar Filtros
                      </Button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Button onClick={() => navigate(`/campanhas/criar`)} className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-3 text-sm">
              <Plus className="w-4 h-4 mr-2" /> Nova Campanha
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedCampaigns.map((campaign, index) => (
          <motion.div key={campaign.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }}>
            <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 bg-card text-card-foreground">
              <CardHeader className="flex-grow p-4 pb-2">
                <CardTitle className="text-base text-card-foreground truncate" title={campaign.name}>{campaign.name}</CardTitle>
                {campaign.clients && (
                  <CardDescription className="text-muted-foreground flex items-center text-xs pt-1">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {campaign.clients.name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-xs text-muted-foreground">
                  Criada em: {new Date(campaign.created_at).toLocaleDateString()}
                </p>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-2 p-4 pt-0">
                 <Button className="w-full h-9 text-sm" onClick={() => handleGoToContent(campaign.id)}>
                    <Bot className="w-4 h-4 mr-2" />
                    Gerar Conteúdo
                 </Button>
                <div className="flex items-center gap-2">
                  <Button className="w-full h-9 text-sm" variant="secondary" onClick={() => navigate(`/campanhas/copilot/${campaign.id}`)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Copiloto de IA
                  </Button>
                   <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={() => navigate(`/campanhas/editar/${campaign.id}`)}>
                      <Edit className="w-4 h-4" />
                      <span className="sr-only">Editar Campanha</span>
                   </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive flex-shrink-0"><Trash2 className="w-4 h-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. Isso excluirá permanentemente a campanha e todos os seus dados associados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(campaign.id)}>Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
        {displayedCampaigns.length === 0 && !loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="col-span-full text-center py-10 bg-card rounded-lg border border-dashed">
                <Target className="w-10 h-10 mx-auto text-muted-foreground" />
                <h3 className="mt-3 text-base font-semibold text-card-foreground">Nenhuma campanha encontrada</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredClients.size > 0 ? "Nenhuma campanha corresponde ao filtro selecionado." : 'Clique em "Nova Campanha" para começar a criar suas estratégias.'}
                </p>
            </motion.div>
        )}
      </div>
    </div>
  );
};

export default Campaigns;