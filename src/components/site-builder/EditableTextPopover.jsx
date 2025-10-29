import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

const EditableTextPopover = ({ target, initialContent, onSave, onRemove, onClose }) => {
  const [content, setContent] = useState(initialContent);

  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const handleSave = () => {
    onSave(content);
  };

  if (!target) return null;

  const targetRect = target().getBoundingClientRect();

  return (
    <Popover open={true} onOpenChange={(open) => !open && onClose()}>
      <PopoverTrigger asChild>
        <div style={{
          position: 'fixed',
          top: targetRect.top,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
          pointerEvents: 'none',
        }}/>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start" side="bottom">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Editar Elemento</h4>
            <p className="text-sm text-muted-foreground">
              Altere o conteúdo ou remova o elemento.
            </p>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="focus-visible:ring-primary"
          />
          <div className="flex justify-between items-center gap-2">
            <Button variant="destructive" size="icon" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Remover Elemento</span>
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EditableTextPopover;