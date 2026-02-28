import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Modal para configurar conexão de LLM (texto) nas configurações de IA.
 * Implementação mínima para compilação; expandir conforme necessário.
 */
const UserLlmConnectionDialog = ({ isOpen, setIsOpen, editingConnection, onFinished }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ name: '', provider: '', api_key: '', default_model: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingConnection) {
      setFormData({
        name: editingConnection.name ?? '',
        provider: editingConnection.provider ?? '',
        api_key: editingConnection.api_key ?? '',
        default_model: editingConnection.default_model ?? '',
      });
    } else {
      setFormData({ name: '', provider: '', api_key: '', default_model: '' });
    }
  }, [editingConnection, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: formData.name,
        provider: formData.provider,
        api_key: formData.api_key,
        default_model: formData.default_model || null,
        capabilities: { text_generation: true },
      };
      if (editingConnection?.id) {
        const { error } = await supabase.from('user_ai_connections').update(payload).eq('id', editingConnection.id);
        if (error) throw error;
        toast.success('Conexão atualizada');
      } else {
        const { error } = await supabase.from('user_ai_connections').insert(payload);
        if (error) throw error;
        toast.success('Conexão criada');
      }
      setIsOpen(false);
      onFinished?.();
    } catch (e) {
      toast.error(e?.message ?? 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingConnection ? 'Editar' : 'Nova'} conexão LLM</DialogTitle>
          <DialogDescription>Configure uma conexão para geração de texto (LLM).</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ex: OpenAI"
            />
          </div>
          <div className="grid gap-2">
            <Label>Provider</Label>
            <Input
              value={formData.provider}
              onChange={(e) => setFormData((p) => ({ ...p, provider: e.target.value }))}
              placeholder="Ex: openai, openrouter"
            />
          </div>
          <div className="grid gap-2">
            <Label>API Key</Label>
            <Input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData((p) => ({ ...p, api_key: e.target.value }))}
              placeholder="sk-..."
            />
          </div>
          <div className="grid gap-2">
            <Label>Modelo padrão</Label>
            <Input
              value={formData.default_model}
              onChange={(e) => setFormData((p) => ({ ...p, default_model: e.target.value }))}
              placeholder="Ex: gpt-4"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isSaving}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserLlmConnectionDialog;
