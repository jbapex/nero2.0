import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

const RefineWithAiModal = ({ isOpen, onClose, onRefine, isLoading }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = () => {
        if (prompt.trim()) {
            onRefine(prompt);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Refinar com IA</DialogTitle>
                    <DialogDescription>
                        Dê uma instrução para a IA refinar o conteúdo gerado. Por exemplo: "Deixe o tom mais informal" ou "Adicione 3 bullet points sobre o benefício X".
                    </DialogDescription>
                </DialogHeader>
                <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Sua instrução aqui..."
                    rows={4}
                    disabled={isLoading}
                />
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={!prompt.trim() || isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Refinar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default RefineWithAiModal;