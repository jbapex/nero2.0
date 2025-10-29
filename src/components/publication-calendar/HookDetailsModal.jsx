import React, { useEffect, useRef } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Trash2, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HookDetailsModal = ({ isOpen, setIsOpen, selectedHook, editedHookText, setEditedHookText, selectedClientId, setHooks, hooks }) => {
  const { toast } = useToast();
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Adiciona um pequeno atraso para garantir que a transição de abertura do diálogo seja concluída
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.select();
      }, 100);
    }
  }, [isOpen]);

  const handleCopyHook = () => {
    navigator.clipboard.writeText(editedHookText);
    toast({ title: 'Copiado!', description: 'O conteúdo do gancho foi copiado para a área de transferência.' });
  };

  const handleDeleteHook = async () => {
    if (!selectedHook.day) return;
    const dayKey = format(selectedHook.day, 'yyyy-MM-dd');

    const { error } = await supabase
      .from('publication_hooks')
      .delete()
      .eq('client_id', selectedClientId)
      .eq('hook_date', dayKey);

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      const newHooks = { ...hooks };
      delete newHooks[dayKey];
      setHooks(newHooks);
      toast({ title: 'Excluído!', description: 'O gancho foi removido do calendário.' });
      setIsOpen(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedHook.day) return;
    const dayKey = format(selectedHook.day, 'yyyy-MM-dd');

    const { error } = await supabase
      .from('publication_hooks')
      .update({ hook_text: editedHookText })
      .eq('client_id', selectedClientId)
      .eq('hook_date', dayKey);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      setHooks(prev => ({ ...prev, [dayKey]: editedHookText }));
      toast({ title: 'Salvo!', description: 'As alterações foram salvas com sucesso.' });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Conteúdo para {selectedHook.day ? format(selectedHook.day, 'dd/MM/yyyy', { locale: ptBR }) : ''}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            ref={textareaRef}
            value={editedHookText}
            onChange={(e) => setEditedHookText(e.target.value)}
            className="min-h-[150px] text-base"
          />
        </div>
        <DialogFooter className="justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleCopyHook}><Copy className="h-4 w-4" /></Button>
            <Button variant="destructive" size="icon" onClick={handleDeleteHook}><Trash2 className="h-4 w-4" /></Button>
            <Button variant="secondary" size="icon" onClick={() => toast({ title: 'Em breve!', description: 'A função de refinar com IA será implementada em breve.' })}><Wand2 className="h-4 w-4" /></Button>
          </div>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancelar</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSaveChanges}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HookDetailsModal;