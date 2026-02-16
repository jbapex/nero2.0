import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Copy, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ContentViewModal from '@/components/flow-builder/modals/ContentViewModal';

const GeneratedContentNode = memo(({ data }) => {
  const content = data?.content ?? data?.generatedText ?? '';
  const label = data?.label || 'Conteúdo gerado';
  const { toast } = useToast();
  const [isViewOpen, setIsViewOpen] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    toast({ title: 'Copiado!', description: 'O conteúdo foi copiado para a área de transferência.' });
  };

  return (
    <>
      <Card className="w-80 max-h-[420px] border-2 border-teal-500/50 shadow-lg overflow-hidden flex flex-col">
        <Handle type="target" position={Position.Left} className="!bg-teal-500" id="target" />
        <CardHeader className="flex-row items-center space-x-2 p-2 bg-teal-500/10 shrink-0">
          <FileText className="w-4 h-4 text-teal-500 shrink-0" />
          <span className="text-sm font-medium truncate">{label}</span>
        </CardHeader>
        <CardContent className="p-2 flex flex-col min-h-0 flex-1">
          <ScrollArea className="flex-1 min-h-[120px] max-h-[280px] rounded-md border bg-muted/30 p-2">
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-left text-sm">
              {content || <span className="text-muted-foreground">Nenhum conteúdo.</span>}
            </div>
          </ScrollArea>
          {content && (
            <div className="flex items-center gap-1 mt-2 shrink-0">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCopy}>
                <Copy className="w-3 h-3 mr-1" /> Copiar
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsViewOpen(true)}>
                <Eye className="w-3 h-3 mr-1" /> Visualizar
              </Button>
            </div>
          )}
        </CardContent>
        <Handle type="source" position={Position.Right} className="!bg-teal-500 w-3 h-3" id="source" />
      </Card>
      <ContentViewModal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={label}
        content={content}
      />
    </>
  );
});

GeneratedContentNode.displayName = 'GeneratedContentNode';

export default GeneratedContentNode;
