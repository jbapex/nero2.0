import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Loader2, Edit, Trash2, Target, ArrowLeft, Bot, User, Tag, Star, Mic, ShoppingBag, Users, BarChart2, Eye, Sparkles, MessageCircle, CalendarDays } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useNavigate } from 'react-router-dom';

const DetailItem = ({ icon: Icon, label, value }) => {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-card-foreground">{label}</p>
        <p className="text-muted-foreground break-words">{value}</p>
      </div>
    </div>
  );
};

const ClientDetails = ({ client, onEdit, onDelete, onNavigateToCampaign, onGoBack }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro ao buscar campanhas", description: error.message, variant: "destructive" });
    } else {
      setCampaigns(data);
    }
    setIsLoading(false);
  }, [client.id, toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);
  
  const handleGoToContent = (campaignId) => {
    onGoBack(); // Close drawer
    navigate(`/campanhas/editar/${campaignId}`, { state: { directToContent: true } });
  };

  const handleGoToCalendar = () => {
    onGoBack(); // Close drawer
    navigate(`/ferramentas/calendario-de-publicacao/${client.id}`);
  };

  return (
    <>
      <DrawerHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onGoBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <DrawerTitle className="truncate" title={client.name}>{client.name}</DrawerTitle>
           </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" /> Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o cliente e todas as suas campanhas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} variant="destructive">
                    Sim, excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DrawerHeader>

      <ScrollArea className="flex-grow p-4">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Informações Essenciais</CardTitle>
              <Button variant="secondary" size="sm" onClick={handleGoToCalendar}>
                <CalendarDays className="w-4 h-4 mr-2" /> Calendário
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <DetailItem icon={User} label="Nome do Criador" value={client.creator_name} />
            <DetailItem icon={Tag} label="Nicho" value={client.niche} />
            <DetailItem icon={Sparkles} label="Estilo em 3 Palavras" value={client.style_in_3_words} />
            <DetailItem icon={ShoppingBag} label="Produto/Serviço a Promover" value={client.product_to_promote} />
            <DetailItem icon={Users} label="Público-alvo Principal" value={client.target_audience} />
            <DetailItem icon={Star} label="Casos de Sucesso" value={client.success_cases} />
            <DetailItem icon={Eye} label="Total de Visualizações do Perfil" value={client.profile_views} />
            <DetailItem icon={BarChart2} label="Total de Seguidores" value={client.followers} />
            <DetailItem icon={Mic} label="Formato de Aparição" value={client.appearance_format} />
            <DetailItem icon={MessageCircle} label="Bordões ou Frases-chave" value={client.catchphrases} />
          </CardContent>
        </Card>

        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5" /> Campanhas
        </h3>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Nenhuma campanha encontrada para este cliente.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="transition-all hover:shadow-md">
                <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <p className="font-semibold text-card-foreground">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                            Criada em: {new Date(campaign.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleGoToContent(campaign.id)}>
                            <Bot className="w-4 h-4 mr-2" /> Gerar Conteúdo
                        </Button>
                        <Button variant="default" size="sm" onClick={() => onNavigateToCampaign(campaign.id)}>
                            <MessageCircle className="w-4 h-4 mr-2" /> Copiloto
                        </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </>
  );
};

export default ClientDetails;