import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Image as ImageIcon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const ImagePresetsTab = () => {
  const [presets, setPresets] = useState([]);
  const [connections, setConnections] = useState([]);
  const [models, setModels] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    prompt_template: '',
    negative_base: '',
    tamanho_default: '1024',
    ai_connection_id: '',
    ai_model_id: ''
  });

  const fetchPresets = useCallback(async () => {
    const { data, error } = await supabase
      .from('im_presets')
      .select('*, ai_connection:ai_connection_id(name), ai_model:ai_model_id(model_name)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar presets", description: error.message, variant: "destructive" });
    } else {
      setPresets(data);
    }
  }, []);

  const fetchConnectionsAndModels = useCallback(async () => {
    const { data: connData, error: connError } = await supabase.from('ai_connections').select('id, name, ai_models(id, model_name, capabilities)');
    if (connError) {
      toast({ title: "Erro ao carregar conexões", description: connError.message, variant: "destructive" });
    } else {
      setConnections(connData);
      const allModels = connData.flatMap(conn => conn.ai_models.filter(m => m.capabilities?.image));
      setModels(allModels);
    }
  }, []);

  useEffect(() => {
    fetchPresets();
    fetchConnectionsAndModels();
  }, [fetchPresets, fetchConnectionsAndModels]);

  useEffect(() => {
    if (editingPreset) {
      setFormData({
        name: editingPreset.name || '',
        prompt_template: editingPreset.prompt_template || '',
        negative_base: editingPreset.negative_base || '',
        tamanho_default: editingPreset.tamanho_default?.toString() || '1024',
        ai_connection_id: editingPreset.ai_connection_id?.toString() || 'null',
        ai_model_id: editingPreset.ai_model_id?.toString() || 'null'
      });
    } else {
      setFormData({
        name: '',
        prompt_template: '',
        negative_base: '',
        tamanho_default: '1024',
        ai_connection_id: 'null',
        ai_model_id: 'null'
      });
    }
  }, [editingPreset, isDialogOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.prompt_template) {
      toast({ title: "Campos obrigatórios", description: "Por favor, preencha o nome e o template do prompt.", variant: "destructive" });
      return;
    }

    const dataToSave = {
      name: formData.name,
      prompt_template: formData.prompt_template,
      negative_base: formData.negative_base || null,
      tamanho_default: parseInt(formData.tamanho_default),
      ai_connection_id: formData.ai_connection_id !== 'null' ? parseInt(formData.ai_connection_id) : null,
      ai_model_id: formData.ai_model_id !== 'null' ? parseInt(formData.ai_model_id) : null,
    };

    if (editingPreset) {
      const { error } = await supabase.from('im_presets').update(dataToSave).eq('id', editingPreset.id);
      if (error) {
        toast({ title: "Erro ao atualizar preset", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Preset atualizado!", description: "O preset foi salvo com sucesso." });
        fetchPresets();
        resetForm();
      }
    } else {
      const { error } = await supabase.from('im_presets').insert([dataToSave]);
      if (error) {
        toast({ title: "Erro ao criar preset", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Preset criado!", description: "O preset foi salvo com sucesso." });
        fetchPresets();
        resetForm();
      }
    }
  };

  const handleEdit = (preset) => {
    setEditingPreset(preset);
    setIsDialogOpen(true);
  };

  const handleDelete = async (presetId) => {
    const { error } = await supabase.from('im_presets').delete().eq('id', presetId);
    if (error) {
      toast({ title: "Erro ao remover preset", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Preset removido!", description: "O preset foi removido com sucesso." });
      fetchPresets();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      prompt_template: '',
      negative_base: '',
      tamanho_default: '1024',
      ai_connection_id: 'null',
      ai_model_id: 'null'
    });
    setEditingPreset(null);
    setIsDialogOpen(false);
  };

  const filteredModelsByConnection = formData.ai_connection_id !== 'null'
    ? models.filter(m => m.ai_connection_id === parseInt(formData.ai_connection_id))
    : models;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <p className="text-muted-foreground mb-4 sm:mb-0">Crie e gerencie presets para geração de imagens, incluindo templates de prompt e configurações padrão.</p>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setIsDialogOpen(true); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground glow-effect" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Novo Preset de Imagem
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-effect border-white/20 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPreset ? 'Editar Preset de Imagem' : 'Novo Preset de Imagem'}</DialogTitle>
              <DialogDescription className="text-gray-400">{editingPreset ? 'Atualize os dados do preset' : 'Preencha os dados do novo preset'}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="preset-name">Nome do Preset</Label>
                <Input id="preset-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Imagem de Produto, Cenário Fantástico" className="glass-effect border-white/20 text-white" required />
              </div>
              <div>
                <Label htmlFor="prompt-template">Template do Prompt</Label>
                <Textarea id="prompt-template" value={formData.prompt_template} onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })} placeholder="Ex: Uma imagem de {{briefing_objetivo}} em estilo {{briefing_tom_de_voz}}." className="glass-effect border-white/20 text-white" required />
                <p className="text-xs text-gray-400 mt-1">Use {"{{briefing_objetivo}}"}, {"{{briefing_publico_alvo}}"}, {"{{briefing_tom_de_voz}}"} para dados da campanha.</p>
              </div>
              <div>
                <Label htmlFor="negative-base">Prompt Negativo (Opcional)</Label>
                <Textarea id="negative-base" value={formData.negative_base} onChange={(e) => setFormData({ ...formData, negative_base: e.target.value })} placeholder="Ex: texto, distorcido, feio, marca d'água" className="glass-effect border-white/20 text-white" />
              </div>
              <div>
                <Label htmlFor="tamanho-default">Tamanho Padrão</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, tamanho_default: value })} value={formData.tamanho_default}>
                  <SelectTrigger id="tamanho-default" className="w-full glass-effect border-white/20 text-white">
                    <SelectValue placeholder="Selecione o tamanho" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-white/20">
                    <SelectItem value="512">512x512</SelectItem>
                    <SelectItem value="1024">1024x1024</SelectItem>
                    <SelectItem value="2048">2048x2048</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ai-connection">Conexão de IA (Opcional)</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, ai_connection_id: value, ai_model_id: 'null' })} value={formData.ai_connection_id}>
                  <SelectTrigger id="ai-connection" className="w-full glass-effect border-white/20 text-white">
                    <SelectValue placeholder="Selecione uma conexão" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-white/20">
                    <SelectItem value="null">Nenhum</SelectItem>
                    {connections.map(conn => (<SelectItem key={conn.id} value={conn.id.toString()}>{conn.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="ai-model">Modelo (Opcional)</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, ai_model_id: value })} value={formData.ai_model_id} disabled={formData.ai_connection_id === 'null' || filteredModelsByConnection.length === 0}>
                  <SelectTrigger id="ai-model" className="w-full glass-effect border-white/20 text-white">
                    <SelectValue placeholder="Selecione um modelo" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border-white/20">
                    <SelectItem value="null">Nenhum</SelectItem>
                    {filteredModelsByConnection.map(model => (<SelectItem key={model.id} value={model.id.toString()}>{model.model_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingPreset ? 'Atualizar' : 'Salvar'} Preset</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {presets.map((preset, index) => (
          <motion.div key={preset.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: index * 0.1 }}>
            <Card className="glass-effect border-white/20 card-hover h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-700 to-blue-900 rounded-lg flex items-center justify-center"><Settings className="w-6 h-6 text-white" /></div>
                    <div>
                      <CardTitle className="text-foreground">{preset.name}</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {preset.ai_connection?.name || 'N/A'} - {preset.ai_model?.model_name || 'N/A'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(preset)} className="text-muted-foreground hover:text-foreground"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(preset.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><p className="text-sm text-muted-foreground mb-1">Template:</p><p className="text-sm text-foreground truncate">{preset.prompt_template}</p></div>
                {preset.negative_base && (<div><p className="text-sm text-muted-foreground mb-1">Negativo:</p><p className="text-sm text-foreground truncate">{preset.negative_base}</p></div>)}
                <div className="flex items-center space-x-2"><ImageIcon className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-foreground">Tamanho Padrão: {preset.tamanho_default}px</span></div>
                <div className="pt-4 border-t border-white/10"><p className="text-xs text-muted-foreground">Criado em {new Date(preset.created_at).toLocaleDateString('pt-BR')}</p></div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      {presets.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="text-center py-12">
          <Settings className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum preset de imagem</h3>
          <p className="text-muted-foreground mb-6">Comece criando seu primeiro preset para geração de imagens.</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Criar Preset</Button>
        </motion.div>
      )}
    </div>
  );
};

export default ImagePresetsTab;