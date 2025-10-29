import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const CampaignTypesTab = ({ nicheTemplates, onDataChange }) => {
  const { toast } = useToast();
  const [campaignTypes, setCampaignTypes] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCampaignType, setEditingCampaignType] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    niche_template_ids: []
  });

  const fetchCampaignTypes = useCallback(async () => {
    const { data, error } = await supabase
      .from('ads_campaign_types')
      .select('*, ads_campaign_type_niche_templates(niche_template_id)')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar tipos de campanha', description: error.message, variant: 'destructive' });
    } else {
      const formattedData = data.map(ct => ({
        ...ct,
        niche_template_ids: ct.ads_campaign_type_niche_templates.map(nt => nt.niche_template_id)
      }));
      setCampaignTypes(formattedData);
    }
  }, [toast]);

  useEffect(() => {
    fetchCampaignTypes();
  }, [fetchCampaignTypes]);

  const resetForm = () => {
    setFormData({ name: '', description: '', niche_template_ids: [] });
    setEditingCampaignType(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (campaignType) => {
    setEditingCampaignType(campaignType);
    setFormData({
      name: campaignType.name,
      description: campaignType.description || '',
      niche_template_ids: campaignType.niche_template_ids.map(id => id.toString())
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (campaignTypeId) => {
    await supabase.from('ads_campaign_type_niche_templates').delete().eq('campaign_type_id', campaignTypeId);
    const { error } = await supabase.from('ads_campaign_types').delete().eq('id', campaignTypeId);
    if (error) {
      toast({ title: 'Erro ao deletar tipo de campanha', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Tipo de campanha deletado!', description: 'O item foi removido com sucesso.' });
      fetchCampaignTypes();
      onDataChange();
    }
  };

  const handleNicheTemplateChange = (ntId) => {
    const stringId = ntId.toString();
    setFormData(prev => {
      const newIds = prev.niche_template_ids.includes(stringId)
        ? prev.niche_template_ids.filter(id => id !== stringId)
        : [...prev.niche_template_ids, stringId];
      return { ...prev, niche_template_ids: newIds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const campaignTypeData = {
      name: formData.name,
      description: formData.description,
    };

    let campaignTypeId;

    if (editingCampaignType) {
      const { data, error } = await supabase.from('ads_campaign_types').update(campaignTypeData).eq('id', editingCampaignType.id).select('id').single();
      if (error) {
        toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
        return;
      }
      campaignTypeId = data.id;
      toast({ title: 'Atualizado com sucesso!' });
    } else {
      const { data, error } = await supabase.from('ads_campaign_types').insert([campaignTypeData]).select('id').single();
      if (error) {
        toast({ title: 'Erro ao criar', description: error.message, variant: 'destructive' });
        return;
      }
      campaignTypeId = data.id;
      toast({ title: 'Criado com sucesso!' });
    }

    await supabase.from('ads_campaign_type_niche_templates').delete().eq('campaign_type_id', campaignTypeId);
    if (formData.niche_template_ids.length > 0) {
      const relations = formData.niche_template_ids.map(ntId => ({ campaign_type_id: campaignTypeId, niche_template_id: parseInt(ntId) }));
      await supabase.from('ads_campaign_type_niche_templates').insert(relations);
    }

    fetchCampaignTypes();
    onDataChange();
    resetForm();
  };

  const getNicheTemplateNames = (ids) => {
    if (!ids || ids.length === 0) return 'Nenhum template de nicho vinculado.';
    return ids.map(id => nicheTemplates.find(nt => nt.id === id)?.niche_name).filter(Boolean).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && resetForm()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo Tipo de Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCampaignType ? 'Editar Tipo de Campanha' : 'Criar Novo Tipo de Campanha'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              <Input name="name" placeholder="Nome (ex: Tráfego para WhatsApp)" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <Input name="description" placeholder="Descrição" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <div>
                <Label>Vincular a Templates de Nicho</Label>
                <div className="space-y-2 p-3 rounded-md border max-h-48 overflow-y-auto">
                  {nicheTemplates.map(nt => (
                    <div key={nt.id} className="flex items-center space-x-2">
                      <Checkbox id={`nt-${nt.id}`} checked={formData.niche_template_ids.includes(nt.id.toString())} onCheckedChange={() => handleNicheTemplateChange(nt.id)} />
                      <Label htmlFor={`nt-${nt.id}`} className="font-normal">{nt.niche_name}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={resetForm}>Cancelar</Button>
                <Button type="submit">{editingCampaignType ? 'Salvar' : 'Criar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignTypes.map((ct, index) => (
          <motion.div key={ct.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.1 }}>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>{ct.name}</CardTitle>
                  <div className="flex space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(ct)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ct.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <CardDescription>{ct.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="p-2 rounded-md bg-muted/50">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Templates de Nicho:</p>
                  <p className="text-xs">{getNicheTemplateNames(ct.niche_template_ids)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CampaignTypesTab;