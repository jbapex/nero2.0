import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Facebook, BrainCircuit, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const agentTypes = [
  { value: 'generic', label: 'Genérico' },
  { value: 'specialized', label: 'Especializado' },
];

const platforms = [
  { value: 'meta_ads', label: 'Meta Ads (Facebook/Instagram)' },
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'tiktok_ads', label: 'TikTok Ads' },
  { value: 'other', label: 'Outro' },
];

const AdsAgentsTab = ({ onDataChange }) => {
  const { toast } = useToast();
  const [agents, setAgents] = useState([]);
  const [llmIntegrations, setLlmIntegrations] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  
  const initialFormData = {
    name: '',
    description: '',
    base_prompt: '',
    agent_type: 'generic',
    platform: '',
    capabilities: '',
    llm_integration_id: null,
  };

  const [formData, setFormData] = useState(initialFormData);

  const fetchAgents = useCallback(async () => {
    const { data, error } = await supabase
      .from('ads_agents')
      .select('*, main_llm:llm_integrations!ads_agents_llm_integration_id_fkey(id, name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar agentes', description: error.message, variant: 'destructive' });
    } else {
      setAgents(data);
    }
  }, [toast]);

  const fetchIntegrations = useCallback(async () => {
    const { data, error } = await supabase.from('llm_integrations').select('id, name');
    if (error) {
      toast({ title: 'Erro ao carregar conexões de IA', description: error.message, variant: 'destructive' });
    } else {
      setLlmIntegrations(data);
    }
  }, [toast]);

  useEffect(() => {
    fetchAgents();
    fetchIntegrations();
  }, [fetchAgents, fetchIntegrations]);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingAgent(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      base_prompt: agent.base_prompt,
      agent_type: agent.agent_type || 'generic',
      platform: agent.platform || '',
      capabilities: (agent.capabilities || []).join(', '),
      llm_integration_id: agent.llm_integration_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (agentId) => {
    const { error } = await supabase.from('ads_agents').delete().eq('id', agentId);
    if (error) {
      toast({ title: 'Erro ao deletar agente', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Agente deletado!', description: 'O agente foi removido com sucesso.' });
      fetchAgents();
      onDataChange();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const agentData = {
      name: formData.name,
      description: formData.description,
      base_prompt: formData.base_prompt,
      agent_type: formData.agent_type,
      platform: formData.platform,
      capabilities: formData.capabilities.split(',').map(c => c.trim()).filter(c => c),
      llm_integration_id: formData.llm_integration_id,
    };

    if (editingAgent) {
      const { error } = await supabase.from('ads_agents').update(agentData).eq('id', editingAgent.id);
      if (error) {
        toast({ title: 'Erro ao atualizar agente', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Agente atualizado!', description: 'Suas alterações foram salvas.' });
    } else {
      const { error } = await supabase.from('ads_agents').insert([agentData]);
      if (error) {
        toast({ title: 'Erro ao criar agente', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Agente criado!', description: 'Seu novo agente está pronto.' });
    }

    fetchAgents();
    onDataChange();
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Agente de ADS</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[625px]">
            <DialogHeader>
              <DialogTitle>{editingAgent ? 'Editar Agente' : 'Criar Novo Agente'}</DialogTitle>
              <DialogDescription>{editingAgent ? 'Atualize os detalhes deste agente.' : 'Preencha os campos para criar um novo agente de ADS.'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <Input name="name" placeholder="Nome do Agente (ex: Meta Ads Specialist)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input name="description" placeholder="Descrição" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <div>
                <Label htmlFor="base_prompt">Prompt Base</Label>
                <Textarea id="base_prompt" name="base_prompt" placeholder="Ex: Você é um especialista em Meta Ads..." value={formData.base_prompt} onChange={(e) => setFormData({ ...formData, base_prompt: e.target.value })} required rows={5} />
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded-md">
                  <Info className="w-4 h-4 flex-shrink-0" />
                  <span>Use <code className="bg-background px-1 py-0.5 rounded-sm font-mono">{'{{dados_campanha}}'}</code> para injetar dinamicamente todo o briefing e os detalhes estratégicos da campanha selecionada.</span>
                </div>
              </div>
              
              <div>
                <Label htmlFor="llm_integration_id">Cérebro de IA (Conexão LLM)</Label>
                <Select
                  value={formData.llm_integration_id ? String(formData.llm_integration_id) : 'default'}
                  onValueChange={(value) => setFormData({ ...formData, llm_integration_id: value === 'default' ? null : Number(value) })}
                >
                  <SelectTrigger id="llm_integration_id" className="w-full">
                    <SelectValue placeholder="Selecione a conexão de IA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={'default'}>Padrão do Sistema</SelectItem>
                    {llmIntegrations.map(integration => (
                      <SelectItem key={integration.id} value={String(integration.id)}>{integration.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Select value={formData.agent_type} onValueChange={value => setFormData({...formData, agent_type: value})}>
                    <SelectTrigger><SelectValue placeholder="Tipo de Agente" /></SelectTrigger>
                    <SelectContent>
                        {agentTypes.map(type => <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={formData.platform} onValueChange={value => setFormData({...formData, platform: value})} disabled={formData.agent_type !== 'specialized'}>
                    <SelectTrigger><SelectValue placeholder="Plataforma" /></SelectTrigger>
                    <SelectContent>
                        {platforms.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
              <Input 
                name="capabilities" 
                placeholder="Capacidades (separadas por vírgula)" 
                value={formData.capabilities} 
                onChange={(e) => setFormData({ ...formData, capabilities: e.target.value })}
                disabled={formData.agent_type !== 'specialized'}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                <Button type="submit">{editingAgent ? 'Salvar Alterações' : 'Criar Agente'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((agent, index) => (
          <motion.div key={agent.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
            <Card className={cn("h-full flex flex-col", agent.agent_type === 'specialized' && 'border-primary/50')}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="flex items-center gap-2">
                    {agent.platform === 'meta_ads' && <Facebook className="w-5 h-5 text-blue-600" />}
                    {agent.name}
                  </CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(agent.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                <div>
                  <p className="text-sm text-muted-foreground italic mb-4">"{agent.base_prompt.substring(0, 100)}{agent.base_prompt.length > 100 ? '...' : ''}"</p>
                  {agent.agent_type === 'specialized' && agent.capabilities && agent.capabilities.length > 0 && (
                    <div className="p-2 rounded-md bg-muted/50 mb-4">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">Capacidades:</p>
                      <p className="text-xs">{agent.capabilities.join(', ')}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground border-t border-border pt-3 mt-auto">
                    <BrainCircuit className="w-4 h-4"/>
                    <span>
                        {agent.main_llm ? `Cérebro: ${agent.main_llm.name}` : 'Cérebro: Padrão do Sistema'}
                    </span>
                 </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdsAgentsTab;