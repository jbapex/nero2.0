import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Eye, EyeOff } from 'lucide-react';

const imageProviderOptions = ['OpenAI', 'OpenRouter', 'Google'];

const ImageConnectionDialog = ({ isOpen, setIsOpen, editingConnection, onFinished }) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'OpenAI',
    api_key: '',
    api_base_url: ''
  });

  useEffect(() => {
    if (editingConnection) {
      setFormData({
        name: editingConnection.name || '',
        provider: editingConnection.provider || 'OpenAI',
        api_key: editingConnection.api_key || '',
        api_base_url: editingConnection.api_base_url || ''
      });
    } else {
      resetForm();
    }
  }, [editingConnection, isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'OpenAI',
      api_key: '',
      api_base_url: 'https://api.openai.com/v1/images/generations'
    });
    setShowApiKey(false);
  };

  const handleProviderChange = (value) => {
    const newFormData = { ...formData, provider: value };
    if (value === 'OpenRouter') {
      newFormData.api_base_url = 'https://openrouter.ai/api/v1/images/generations';
    } else if (value === 'OpenAI') {
      newFormData.api_base_url = 'https://api.openai.com/v1/images/generations';
    } else if (value === 'Google') {
        newFormData.api_base_url = 'https://generativelanguage.googleapis.com/v1beta/models';
    } else {
      newFormData.api_base_url = '';
    }
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.api_key) {
      toast({ title: "Campos obrigatórios", description: "Por favor, preencha o nome e a chave da API.", variant: "destructive" });
      return;
    }

    const dataToSave = {
      name: formData.name,
      provider: formData.provider,
      api_key: formData.api_key,
      api_base_url: formData.api_base_url || null,
      capabilities: { "image_generation": true }
    };

    let error;
    if (editingConnection) {
      ({ error } = await supabase.from('ai_connections').update(dataToSave).eq('id', editingConnection.id));
    } else {
      ({ error } = await supabase.from('ai_connections').insert([dataToSave]));
    }

    if (error) {
      toast({ title: `Erro ao ${editingConnection ? 'atualizar' : 'criar'} conexão`, description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Conexão ${editingConnection ? 'atualizada' : 'criada'}!`, description: "A configuração foi salva com sucesso." });
      onFinished();
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); setIsOpen(open); }}>
      <DialogContent className="glass-effect border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editingConnection ? 'Editar Conexão de Imagem' : 'Nova Conexão de Imagem'}</DialogTitle>
          <DialogDescription className="text-gray-400">{editingConnection ? 'Atualize os dados da conexão' : 'Preencha os dados da nova conexão'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="conn-name">Nome da Conexão</Label>
            <Input id="conn-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Meu Google Gemini" className="glass-effect border-white/20 text-white" required />
          </div>
          <div>
            <Label htmlFor="conn-provider">Provedor</Label>
            <Select onValueChange={handleProviderChange} value={formData.provider}>
              <SelectTrigger id="conn-provider" className="w-full glass-effect border-white/20 text-white">
                <SelectValue placeholder="Selecione um provedor" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 text-white border-white/20">
                {imageProviderOptions.map(provider => (<SelectItem key={provider} value={provider}>{provider}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="conn-api_key">Chave da API (API Key)</Label>
            <div className="relative">
              <Input id="conn-api_key" type={showApiKey ? 'text' : 'password'} value={formData.api_key} onChange={(e) => setFormData({ ...formData, api_key: e.target.value })} className="glass-effect border-white/20 text-white pr-10" required />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="conn-api_base_url">URL Base da API</Label>
            <Input id="conn-api_base_url" value={formData.api_base_url} onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })} placeholder="Preenchido automaticamente pelo provedor" className="glass-effect border-white/20 text-white" />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">{editingConnection ? 'Atualizar' : 'Salvar'} Conexão</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImageConnectionDialog;