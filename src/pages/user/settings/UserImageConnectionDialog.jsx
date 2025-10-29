import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/lib/customSupabaseClient';
import { Eye, EyeOff } from 'lucide-react';

const imageProviderOptions = ['Google'];

const UserImageConnectionDialog = ({ isOpen, setIsOpen, editingConnection, onFinished }) => {
  const { user } = useAuth();
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'Google',
    api_key: '',
    api_url: '',
    default_model: ''
  });

  const getInitialFormData = () => ({
    name: '',
    provider: 'Google',
    api_key: '',
    api_url: 'https://generativelanguage.googleapis.com/v1beta',
    default_model: 'gemini-1.5-flash-image-preview'
  });

  useEffect(() => {
    if (isOpen) {
        if (editingConnection) {
            setFormData({
                name: editingConnection.name || '',
                provider: editingConnection.provider || 'Google',
                api_key: editingConnection.api_key || '',
                api_url: editingConnection.api_url || 'https://generativelanguage.googleapis.com/v1beta',
                default_model: editingConnection.default_model || 'gemini-1.5-flash-image-preview',
            });
        } else {
            setFormData(getInitialFormData());
        }
        setShowApiKey(false);
    }
  }, [editingConnection, isOpen]);

  const handleProviderChange = (value) => {
    const newFormData = { ...formData, provider: value };
    if (value === 'Google') {
        newFormData.api_url = 'https://generativelanguage.googleapis.com/v1beta';
        newFormData.default_model = 'gemini-1.5-flash-image-preview';
    } else {
      newFormData.api_url = '';
      newFormData.default_model = '';
    }
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.api_key) {
      toast.error("Campos obrigatórios", { description: "Por favor, preencha o nome e a chave da API." });
      return;
    }

    const dataToSave = {
      user_id: user.id,
      name: formData.name,
      provider: formData.provider,
      api_key: formData.api_key,
      api_url: formData.api_url,
      default_model: formData.default_model,
      capabilities: { "image_generation": true, "text_generation": false, "site_builder": false },
      is_active: false,
    };

    let error;
    if (editingConnection) {
      ({ error } = await supabase.from('user_ai_connections').update(dataToSave).eq('id', editingConnection.id));
    } else {
      ({ error } = await supabase.from('user_ai_connections').insert([dataToSave]));
    }

    if (error) {
      toast.error(`Erro ao ${editingConnection ? 'atualizar' : 'criar'} conexão`, { description: error.message });
    } else {
      toast.success(`Conexão ${editingConnection ? 'atualizada' : 'criada'}!`);
      onFinished();
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="glass-effect border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editingConnection ? 'Editar Conexão de Imagem' : 'Nova Conexão de Imagem'}</DialogTitle>
          <DialogDescription className="text-gray-400">{editingConnection ? 'Atualize os dados da conexão' : 'Adicione sua chave de API para gerar imagens'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <Label htmlFor="conn-name">Nome da Conexão</Label>
            <Input id="conn-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Meu Gemini" className="glass-input" required />
          </div>
          <div>
            <Label htmlFor="conn-provider">Provedor</Label>
            <Select onValueChange={handleProviderChange} value={formData.provider} disabled>
              <SelectTrigger id="conn-provider" className="w-full glass-input">
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
              <Input id="conn-api_key" type={showApiKey ? 'text' : 'password'} value={formData.api_key} onChange={(e) => setFormData({ ...formData, api_key: e.target.value })} className="glass-input pr-10" required />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white" onClick={() => setShowApiKey(!showApiKey)}>
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Sua chave é armazenada de forma segura e usada apenas para se comunicar com a API do Google.</p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground glow-effect">{editingConnection ? 'Atualizar' : 'Salvar'} Conexão</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserImageConnectionDialog;