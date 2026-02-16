import React, { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageIcon, Expand, Download } from 'lucide-react';

const GeneratedImageNode = memo(({ data }) => {
  const imageUrl = data?.imageUrl || '';
  const label = data?.label || 'Imagem gerada';
  const [previewOpen, setPreviewOpen] = useState(false);

  return (
    <Card className="w-56 border-2 border-emerald-500/50 shadow-lg overflow-hidden">
      <Handle type="target" position={Position.Left} className="!bg-emerald-500" />
      <CardHeader className="flex-row items-center space-x-2 p-2 bg-emerald-500/10">
        <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-medium truncate">{label}</span>
      </CardHeader>
      <CardContent className="p-2">
        <div className="w-full aspect-square bg-muted rounded-md overflow-hidden flex items-center justify-center relative group">
          {imageUrl ? (
            <>
              <img src={imageUrl} alt={label} className="w-full h-full object-cover cursor-pointer" onClick={() => setPreviewOpen(true)} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <Button type="button" size="sm" variant="secondary" className="h-7 text-xs" onClick={() => setPreviewOpen(true)}>
                  <Expand className="w-3 h-3 mr-1" /> Ver
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    const a = document.createElement('a');
                    a.href = imageUrl;
                    a.download = `imagem-gerada-${Date.now()}.png`;
                    a.click();
                  }}
                >
                  <Download className="w-3 h-3 mr-1" /> Baixar
                </Button>
              </div>
            </>
          ) : (
            <ImageIcon className="w-10 h-10 text-muted-foreground" />
          )}
        </div>
        {imageUrl && (
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-[90vw] max-h-[90vh] flex flex-col">
              <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
              <div className="flex-1 min-h-0 overflow-auto flex justify-center">
                <img src={imageUrl} alt={label} className="max-w-full max-h-[70vh] object-contain" />
              </div>
              <Button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = imageUrl;
                  a.download = `imagem-gerada-${Date.now()}.png`;
                  a.click();
                }}
              >
                <Download className="w-4 h-4 mr-2" /> Baixar imagem
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
});

GeneratedImageNode.displayName = 'GeneratedImageNode';

export default GeneratedImageNode;
