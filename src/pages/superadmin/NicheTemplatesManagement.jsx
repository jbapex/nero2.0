import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, LayoutList, BrainCircuit, FileText, Target, Eye, User, Mic, DollarSign, Users, Tv, PenTool } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const marketingCategories = [
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'B2B', label: 'B2B' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'Local Business', label: 'Negócio Local' },
  { value: 'Other', label: 'Outro' },
];

const NicheTemplatesManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [modules, setModules] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  
  const initialFormData = {
    niche_name: '',
    category: '',
    default_briefing: '',
    module_ids: [],
    marketing_data: {
      metrics: { ctr: '', cpa: '', roas: '', conversion_rate: '', benchmarks: '' },
      audience: { age_range: '', gender_location: '', interests: '', behaviors: '', income_level: '', funnel_stage: '' },
      channels: { distribution: [], budget_allocation: '', bidding_strategy: '', remarketing: '' },
      personas: [{ name: '', description: '', pains: '', goals: '', channels: '', triggers: '' }],
      content: { key_messages: '', ctas: '', visual_guidelines: '', tone_of_voice: '', copy_structure: '' }
    }
  };

  const [formData, setFormData] = useState(initialFormData);

  const fetchTemplates = useCallback(async () => {
    const { data, error } = await supabase
      .from('niche_templates')
      .select('*, niche_template_modules(module_id)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar templates", description: error.message, variant: 'destructive' });
    } else {
      const formattedTemplates = data.map(template => ({
        ...template,
        module_ids: template.niche_template_modules.map(pm => pm.module_id)
      }));
      setTemplates(formattedTemplates);
    }
  }, []);

  const fetchModules = useCallback(async () => {
    const { data, error } = await supabase.from('modules').select('id, name');
    if (error) {
      toast({ title: "Erro ao carregar módulos", description: error.message, variant: 'destructive' });
    } else {
      setModules(data);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchModules();
  }, [fetchTemplates, fetchModules]);

  const handleMarketingDataChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      marketing_data: {
        ...prev.marketing_data,
        [section]: {
          ...prev.marketing_data[section],
          [field]: value
        }
      }
    }));
  };
  
  const handlePersonaChange = (index, field, value) => {
    setFormData(prev => {
      const newPersonas = [...prev.marketing_data.personas];
      newPersonas[index] = { ...newPersonas[index], [field]: value };
      return {
        ...prev,
        marketing_data: {
          ...prev.marketing_data,
          personas: newPersonas
        }
      };
    });
  };
  
  const addPersona = () => {
    const newPersonas = [...formData.marketing_data.personas, { name: '', description: '', pains: '', goals: '', channels: '', triggers: '' }];
     setFormData(prev => ({
      ...prev,
      marketing_data: {
        ...prev.marketing_data,
        personas: newPersonas,
      }
    }));
  };

  const removePersona = (index) => {
    const newPersonas = formData.marketing_data.personas.filter((_, i) => i !== index);
     setFormData(prev => ({
      ...prev,
      marketing_data: {
        ...prev.marketing_data,
        personas: newPersonas,
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const templateData = {
      niche_name: formData.niche_name,
      default_briefing: formData.default_briefing,
      category: formData.category,
      marketing_data: formData.marketing_data
    };

    if (editingTemplate) {
      const { data: updatedTemplate, error: templateError } = await supabase
        .from('niche_templates')
        .update(templateData)
        .eq('id', editingTemplate.id)
        .select()
        .single();

      if (templateError) {
        toast({ title: 'Erro ao atualizar template', description: templateError.message, variant: 'destructive' });
        return;
      }
      toast({ title: "Template atualizado!", description: "O template foi atualizado com sucesso." });
    } else {
      const { data: newTemplate, error: templateError } = await supabase
        .from('niche_templates')
        .insert([templateData])
        .select()
        .single();

      if (templateError) {
        toast({ title: 'Erro ao criar template', description: templateError.message, variant: 'destructive' });
        return;
      }
      toast({ title: "Template criado!", description: "Novo template foi criado com sucesso." });
    }

    fetchTemplates();
    resetForm();
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
  
    const templateMarketingData = template.marketing_data || {};
  
    const mergedMarketingData = {
      ...initialFormData.marketing_data,
      ...templateMarketingData,
      metrics: { ...initialFormData.marketing_data.metrics, ...(templateMarketingData.metrics || {}) },
      audience: { ...initialFormData.marketing_data.audience, ...(templateMarketingData.audience || {}) },
      channels: { ...initialFormData.marketing_data.channels, ...(templateMarketingData.channels || {}) },
      content: { ...initialFormData.marketing_data.content, ...(templateMarketingData.content || {}) },
      personas: Array.isArray(templateMarketingData.personas) && templateMarketingData.personas.length > 0
        ? templateMarketingData.personas
        : initialFormData.marketing_data.personas,
    };
  
    setFormData({
      niche_name: template.niche_name || '',
      category: template.category || '',
      default_briefing: template.default_briefing || '',
      module_ids: template.module_ids.map(id => id.toString()),
      marketing_data: mergedMarketingData
    });
  
    setIsDialogOpen(true);
  };

  const handleDelete = async (templateId) => {
    const { error } = await supabase.from('niche_templates').delete().eq('id', templateId);
    if (error) {
      toast({ title: "Erro ao remover template", description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Template removido!", description: "O template foi removido com sucesso." });
      fetchTemplates();
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingTemplate(null);
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-center text-center md:text-left">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Templates de Marketing</h1>
          <p className="text-sm md:text-base text-muted-foreground">Crie e gerencie templates de marketing completos para agilizar campanhas.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)} className="mt-4 sm:mt-0">
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[90vw] md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? 'Editar Template de Marketing' : 'Criar Novo Template de Marketing'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
              <Tabs defaultValue="basic" className="flex-grow flex flex-col overflow-hidden">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="metrics">Métricas</TabsTrigger>
                  <TabsTrigger value="audience">Público</TabsTrigger>
                  <TabsTrigger value="channels">Canais</TabsTrigger>
                  <TabsTrigger value="content">Conteúdo</TabsTrigger>
                </TabsList>
                <div className="flex-grow overflow-y-auto p-1 mt-4">
                  <TabsContent value="basic" className="space-y-4">
                    <Input placeholder="Nome do Template" value={formData.niche_name} onChange={e => setFormData({...formData, niche_name: e.target.value})} required/>
                    <Select value={formData.category} onValueChange={value => setFormData({...formData, category: value})}>
                        <SelectTrigger><SelectValue placeholder="Selecione a categoria de marketing..." /></SelectTrigger>
                        <SelectContent>
                            {marketingCategories.map(cat => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Textarea placeholder="Briefing Padrão / Descrição" value={formData.default_briefing} onChange={e => setFormData({...formData, default_briefing: e.target.value})} />
                  </TabsContent>
                  <TabsContent value="metrics" className="space-y-4">
                      <Input placeholder="Target CTR (%)" type="number" value={formData.marketing_data.metrics.ctr} onChange={e => handleMarketingDataChange('metrics', 'ctr', e.target.value)} />
                      <Input placeholder="Target CPA (R$)" type="number" value={formData.marketing_data.metrics.cpa} onChange={e => handleMarketingDataChange('metrics', 'cpa', e.target.value)} />
                      <Input placeholder="Target ROAS" type="number" value={formData.marketing_data.metrics.roas} onChange={e => handleMarketingDataChange('metrics', 'roas', e.target.value)} />
                      <Input placeholder="Taxa de Conversão Esperada (%)" type="number" value={formData.marketing_data.metrics.conversion_rate} onChange={e => handleMarketingDataChange('metrics', 'conversion_rate', e.target.value)} />
                      <Textarea placeholder="Benchmarks do Setor" value={formData.marketing_data.metrics.benchmarks} onChange={e => handleMarketingDataChange('metrics', 'benchmarks', e.target.value)} />
                  </TabsContent>
                  <TabsContent value="audience" className="space-y-4">
                     <Input placeholder="Faixa Etária (ex: 25-45)" value={formData.marketing_data.audience.age_range} onChange={e => handleMarketingDataChange('audience', 'age_range', e.target.value)} />
                     <Input placeholder="Gênero e Localização" value={formData.marketing_data.audience.gender_location} onChange={e => handleMarketingDataChange('audience', 'gender_location', e.target.value)} />
                     <Textarea placeholder="Interesses, Hobbies e Comportamentos" value={formData.marketing_data.audience.interests} onChange={e => handleMarketingDataChange('audience', 'interests', e.target.value)} />
                     <Input placeholder="Nível de Renda (ex: Classe B, Acima de R$5k)" value={formData.marketing_data.audience.income_level} onChange={e => handleMarketingDataChange('audience', 'income_level', e.target.value)} />
                     <Input placeholder="Estágio do Funil (ex: Topo, Meio, Fundo)" value={formData.marketing_data.audience.funnel_stage} onChange={e => handleMarketingDataChange('audience', 'funnel_stage', e.target.value)} />
                     
                     <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Personas</h4>
                        {formData.marketing_data.personas.map((persona, index) => (
                          <div key={index} className="p-4 border rounded-md mb-4 space-y-2">
                             <Input placeholder="Nome da Persona" value={persona.name} onChange={e => handlePersonaChange(index, 'name', e.target.value)} />
                             <Textarea placeholder="Dores e Necessidades" value={persona.pains} onChange={e => handlePersonaChange(index, 'pains', e.target.value)} />
                             <Textarea placeholder="Objetivos e Aspirações" value={persona.goals} onChange={e => handlePersonaChange(index, 'goals', e.target.value)} />
                             <Button type="button" variant="destructive" size="sm" onClick={() => removePersona(index)}>Remover Persona</Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addPersona}>Adicionar Persona</Button>
                     </div>
                  </TabsContent>
                  <TabsContent value="channels" className="space-y-4">
                     <Input placeholder="Canais de Distribuição (ex: Google, Facebook)" value={formData.marketing_data.channels.distribution} onChange={e => handleMarketingDataChange('channels', 'distribution', e.target.value.split(','))} />
                     <Input placeholder="Alocação de Orçamento por Canal" value={formData.marketing_data.channels.budget_allocation} onChange={e => handleMarketingDataChange('channels', 'budget_allocation', e.target.value)} />
                     <Input placeholder="Estratégia de Bidding (ex: Maximizar Cliques)" value={formData.marketing_data.channels.bidding_strategy} onChange={e => handleMarketingDataChange('channels', 'bidding_strategy', e.target.value)} />
                     <Textarea placeholder="Configurações de Remarketing" value={formData.marketing_data.channels.remarketing} onChange={e => handleMarketingDataChange('channels', 'remarketing', e.target.value)} />
                  </TabsContent>
                  <TabsContent value="content" className="space-y-4">
                     <Textarea placeholder="Mensagens-chave" value={formData.marketing_data.content.key_messages} onChange={e => handleMarketingDataChange('content', 'key_messages', e.target.value)} />
                     <Textarea placeholder="Call-to-actions (CTAs)" value={formData.marketing_data.content.ctas} onChange={e => handleMarketingDataChange('content', 'ctas', e.target.value)} />
                     <Textarea placeholder="Diretrizes Visuais" value={formData.marketing_data.content.visual_guidelines} onChange={e => handleMarketingDataChange('content', 'visual_guidelines', e.target.value)} />
                     <Textarea placeholder="Tom de Voz Detalhado" value={formData.marketing_data.content.tone_of_voice} onChange={e => handleMarketingDataChange('content', 'tone_of_voice', e.target.value)} />
                     <Textarea placeholder="Estrutura de Copy" value={formData.marketing_data.content.copy_structure} onChange={e => handleMarketingDataChange('content', 'copy_structure', e.target.value)} />
                  </TabsContent>
                </div>
              </Tabs>
              <DialogFooter className="mt-4 pt-4 border-t">
                <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                <Button type="submit">{editingTemplate ? 'Atualizar Template' : 'Criar Template'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <motion.div key={template.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }}>
            <Card className="bg-card h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{template.niche_name}</CardTitle>
                    <CardDescription>{template.category || 'Sem Categoria'}</CardDescription>
                  </div>
                   <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(template)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(template.id)} className="text-destructive-foreground hover:bg-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-muted-foreground line-clamp-3">{template.default_briefing}</p>
                {template.marketing_data?.metrics && (
                   <div className="mt-4 text-xs text-muted-foreground space-y-1">
                      <p><strong>CPA:</strong> {template.marketing_data.metrics.cpa || 'N/A'}</p>
                      <p><strong>ROAS:</strong> {template.marketing_data.metrics.roas || 'N/A'}</p>
                   </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
       {templates.length === 0 && (
        <div className="text-center py-16 col-span-full">
          <LayoutList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold">Nenhum template criado</h3>
          <p className="text-muted-foreground mb-6">Comece criando seu primeiro template de marketing.</p>
          <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Criar Primeiro Template</Button>
        </div>
      )}
    </div>
  );
};

export default NicheTemplatesManagement;