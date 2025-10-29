import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Search, FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useValidation } from '@/hooks/useValidation';

const validationRules = {
  name: { required: true, message: 'O nome da campanha é obrigatório.' },
  objective: { required: true, message: 'O objetivo da campanha é obrigatório.' },
};

const BriefingStep = ({ data, updateData, applyTemplate, setClient, autoSaveStatus, errors: parentErrors }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState([]);
  const [hasClients, setHasClients] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  const { errors, validate, validateField } = useValidation(validationRules);

  const fetchUserContext = useCallback(async () => {
    if (!user) return;
    setLoadingClients(true);
    const { data: clientsData, error } = await supabase
      .from('clients')
      .select('id, name')
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Erro ao carregar clientes', description: error.message, variant: 'destructive' });
    } else {
      setClients(clientsData || []);
      setHasClients(clientsData && clientsData.length > 0);
    }
    setLoadingClients(false);
  }, [user, toast]);

  useEffect(() => {
    fetchUserContext();
  }, [fetchUserContext]);

  useEffect(() => {
    if (data) {
      validate(data);
    }
  }, [data, validate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateData(name, value);
    validateField(name, value);
  };

  const handleClientChange = (clientId) => {
    const selectedClient = clients.find(c => c.id.toString() === clientId);
    if (selectedClient) {
      updateData('client_id', selectedClient.id);
      setClient(selectedClient);
    }
  };

  const handleAddNewClient = async () => {
    if (!newClientName.trim()) {
      toast({ title: 'Nome inválido', description: 'O nome do cliente é obrigatório.', variant: 'destructive' });
      return;
    }
    setIsSubmittingClient(true);
    const { data: newClient, error } = await supabase
      .from('clients')
      .insert({ name: newClientName, user_id: user.id })
      .select()
      .single();
    
    setIsSubmittingClient(false);
    if (error) {
      toast({ title: 'Erro ao criar cliente', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Cliente criado!', description: `"${newClientName}" foi adicionado.` });
      setIsClientDialogOpen(false);
      setNewClientName('');
      await fetchUserContext();
      handleClientChange(newClient.id.toString());
    }
  };

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    const { data: templatesData, error } = await supabase
      .from('niche_templates')
      .select('*');
    
    if (error) {
      toast({ title: 'Erro ao buscar templates', description: error.message, variant: 'destructive' });
    } else {
      setTemplates(templatesData);
    }
    setLoadingTemplates(false);
  };

  const allErrors = { ...errors, ...parentErrors };

  return (
    <div className="space-y-6">
      <div className="flex justify-end h-6">
        {autoSaveStatus && (
          <div className="text-sm text-muted-foreground transition-opacity duration-300 flex items-center gap-2">
            {autoSaveStatus === 'Salvando...' && <Loader2 className="w-4 h-4 animate-spin" />}
            {autoSaveStatus}
          </div>
        )}
      </div>

      {loadingClients ? (
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Carregando contexto...</span>
        </div>
      ) : hasClients && (
        <div className="space-y-2">
          <Label htmlFor="client-select">Cliente</Label>
          <div className="flex items-center gap-2">
            <Select onValueChange={handleClientChange} value={data.client_id?.toString()}>
              <SelectTrigger id="client-select">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id.toString()}>{client.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon"><Plus className="w-4 h-4" /></Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Cliente</DialogTitle>
                  <DialogDescription>Crie um novo cliente para associar a esta campanha.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input 
                    placeholder="Nome do novo cliente" 
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="ghost">Cancelar</Button></DialogClose>
                  <Button onClick={handleAddNewClient} disabled={isSubmittingClient}>
                    {isSubmittingClient && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar Cliente
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Campanha</Label>
        <Input id="name" name="name" value={data.name || ''} onChange={handleInputChange} placeholder="Ex: Lançamento de Verão" />
        {allErrors.name && <p className="text-sm text-destructive mt-1">{allErrors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective">Objetivo Principal da Campanha</Label>
        <Textarea id="objective" name="objective" value={data.objective || ''} onChange={handleInputChange} placeholder="Ex: Aumentar as vendas do novo produto em 20% nos próximos 30 dias." />
        {allErrors.objective && <p className="text-sm text-destructive mt-1">{allErrors.objective}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="budget">Orçamento (R$)</Label>
          <Input id="budget" name="budget" type="number" value={data.budget || ''} onChange={handleInputChange} placeholder="Ex: 1500.00" />
        </div>
        <div className="space-y-2">
          <Label>Período da Campanha</Label>
          <div className="flex items-center gap-2">
            <Input id="start_date" name="start_date" type="date" value={data.start_date || ''} onChange={handleInputChange} />
            <span className="text-muted-foreground">até</span>
            <Input id="end_date" name="end_date" type="date" value={data.end_date || ''} onChange={handleInputChange} />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_audience">Público-Alvo</Label>
        <Textarea id="target_audience" name="target_audience" value={data.target_audience || ''} onChange={handleInputChange} placeholder="Ex: Mulheres, 25-40 anos, interessadas em moda sustentável e bem-estar." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brand_differential">Diferencial da Marca/Produto</Label>
        <Textarea id="brand_differential" name="brand_differential" value={data.brand_differential || ''} onChange={handleInputChange} placeholder="Ex: Únicos no mercado com tecidos 100% orgânicos e produção local." />
      </div>

      <div className="space-y-2">
        <Label htmlFor="tone_of_voice">Tom de Voz</Label>
        <Textarea id="tone_of_voice" name="tone_of_voice" value={data.tone_of_voice || ''} onChange={handleInputChange} placeholder="Ex: Inspirador, amigável e confiante." />
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" onClick={fetchTemplates}>
            <Search className="w-4 h-4 mr-2" />
            Buscar Template de Nicho
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Templates de Nicho</DialogTitle>
            <DialogDescription>Selecione um template para preencher automaticamente as informações da campanha.</DialogDescription>
          </DialogHeader>
          {loadingTemplates ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
              {templates.map(template => (
                <DialogClose asChild key={template.id}>
                  <button onClick={() => applyTemplate(template)} className="text-left">
                    <div className="p-4 border rounded-lg hover:bg-accent transition-colors h-full flex flex-col">
                      <h4 className="font-bold flex items-center"><FileText className="w-4 h-4 mr-2" />{template.niche_name}</h4>
                      <p className="text-sm text-muted-foreground mt-2 flex-grow">{template.default_briefing}</p>
                      <span className="text-xs text-primary mt-2 bg-primary/10 px-2 py-1 rounded-full self-start">{template.category}</span>
                    </div>
                  </button>
                </DialogClose>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BriefingStep;