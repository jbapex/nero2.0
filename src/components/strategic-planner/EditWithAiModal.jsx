import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Wand2, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const EditWithAiModal = ({ onGenerate, isLoading, title, triggerButton, disabled = false }) => {
    const [prompt, setPrompt] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();
  
    const handleGenerate = () => {
      if (!prompt.trim()) {
        toast({ title: "Instrução vazia", description: "Por favor, digite uma instrução para a IA.", variant: "destructive" });
        return;
      }
      onGenerate(prompt);
      setIsOpen(false);
      setPrompt('');
    };
    
    const Trigger = triggerButton || (
      <Button size="sm" variant="outline" disabled={disabled}>
        <Wand2 className="w-4 h-4 mr-1" /> Editar com IA
      </Button>
    );
  
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {Trigger}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar "{title}" com IA</DialogTitle>
            <DialogDescription>Dê instruções para a IA refinar o conteúdo existente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input 
              placeholder="Ex: 'Deixe o tom mais formal' ou 'Adicione um item sobre...'" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Refinar Conteúdo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
};

export default EditWithAiModal;