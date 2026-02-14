import React, { useState, useRef, useCallback } from 'react';
import { Loader2, Download, Sparkles, Upload, X, Crop, Maximize2, Type, Eraser, ImageMinus, ImageIcon, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { uploadNeuroDesignFile } from '@/lib/neurodesignStorage';
import { cn } from '@/lib/utils';

const REFINE_DIMENSIONS = [
  { value: '1:1', label: '1:1 Feed' },
  { value: '4:5', label: '4:5 Feed' },
  { value: '9:16', label: '9:16 Stories' },
  { value: '16:9', label: '16:9 Horizontal' },
];

const SELECTION_ACTIONS = [
  { value: 'add_text', label: 'Adicionar texto aqui', icon: Type },
  { value: 'remove_text', label: 'Remover texto só nesta área', icon: Eraser },
  { value: 'remove_content', label: 'Remover conteúdo desta área', icon: ImageMinus },
  { value: 'replace', label: 'Substituir por imagem', icon: ImageIcon },
  { value: 'free', label: 'Instrução livre', icon: MessageSquare },
];

const isDemoPlaceholder = (url) => url && typeof url === 'string' && url.includes('placehold.co');

const PreviewPanel = ({ project, user, selectedImage, images, isGenerating, isRefining, onRefine, onDownload, onSelectImage }) => {
  const { toast } = useToast();
  const [refineInstruction, setRefineInstruction] = useState('');
  const [refineDimensions, setRefineDimensions] = useState('1:1');
  const [referenceArtFile, setReferenceArtFile] = useState(null);
  const [referenceArtPreviewUrl, setReferenceArtPreviewUrl] = useState('');
  const [replacementFile, setReplacementFile] = useState(null);
  const [replacementPreviewUrl, setReplacementPreviewUrl] = useState('');
  const [selectionRegion, setSelectionRegion] = useState(null);
  const [selectionAction, setSelectionAction] = useState('free');
  const [selectionText, setSelectionText] = useState('');
  const [isUploadingRefine, setIsUploadingRefine] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState(null);
  const [drawCurrent, setDrawCurrent] = useState(null);
  const previewContainerRef = useRef(null);
  const previewImgRef = useRef(null);
  const instructionInputRef = useRef(null);
  const selectionActionBlockRef = useRef(null);
  const referenceArtInputRef = useRef(null);
  const replacementInputRef = useRef(null);
  const addImageInputRef = useRef(null);
  const [addImageFile, setAddImageFile] = useState(null);
  const [addImagePreviewUrl, setAddImagePreviewUrl] = useState('');
  const [fullscreenOpen, setFullscreenOpen] = useState(false);

  const imageUrl = selectedImage?.url || selectedImage?.thumbnail_url;
  const isLoading = isGenerating || isRefining;
  const showDemoNotice = !isLoading && imageUrl && isDemoPlaceholder(imageUrl);

  const clearReferenceArt = () => {
    setReferenceArtFile(null);
    if (referenceArtPreviewUrl) URL.revokeObjectURL(referenceArtPreviewUrl);
    setReferenceArtPreviewUrl('');
  };

  const clearReplacement = () => {
    setReplacementFile(null);
    if (replacementPreviewUrl) URL.revokeObjectURL(replacementPreviewUrl);
    setReplacementPreviewUrl('');
  };

  const clearAddImage = () => {
    setAddImageFile(null);
    if (addImagePreviewUrl) URL.revokeObjectURL(addImagePreviewUrl);
    setAddImagePreviewUrl('');
  };

  const handleAddImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)/i.test(file.type)) {
      toast({ title: 'Use uma imagem (JPEG, PNG, WebP ou GIF)', variant: 'destructive' });
      return;
    }
    clearAddImage();
    setAddImageFile(file);
    setAddImagePreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleReferenceArtChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)/i.test(file.type)) {
      toast({ title: 'Use uma imagem (JPEG, PNG, WebP ou GIF)', variant: 'destructive' });
      return;
    }
    clearReferenceArt();
    setReferenceArtFile(file);
    setReferenceArtPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleReplacementChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif)/i.test(file.type)) {
      toast({ title: 'Use uma imagem (JPEG, PNG, WebP ou GIF)', variant: 'destructive' });
      return;
    }
    clearReplacement();
    setReplacementFile(file);
    setReplacementPreviewUrl(URL.createObjectURL(file));
    e.target.value = '';
  };

  const getNormalizedRegion = useCallback(() => {
    const container = previewContainerRef.current;
    const img = previewImgRef.current;
    if (!container || !img || !drawStart || !drawCurrent) return null;
    const cRect = container.getBoundingClientRect();
    const iRect = img.getBoundingClientRect();
    const imgLeft = iRect.left - cRect.left;
    const imgTop = iRect.top - cRect.top;
    const px1 = Math.max(imgLeft, Math.min(drawStart.x, drawCurrent.x));
    const px2 = Math.min(imgLeft + iRect.width, Math.max(drawStart.x, drawCurrent.x));
    const py1 = Math.max(imgTop, Math.min(drawStart.y, drawCurrent.y));
    const py2 = Math.min(imgTop + iRect.height, Math.max(drawStart.y, drawCurrent.y));
    const w = px2 - px1;
    const h = py2 - py1;
    if (w < 5 || h < 5) return null;
    return {
      x: (px1 - imgLeft) / iRect.width,
      y: (py1 - imgTop) / iRect.height,
      width: w / iRect.width,
      height: h / iRect.height,
    };
  }, [drawStart, drawCurrent]);

  const generateCropBlob = useCallback(async () => {
    const img = previewImgRef.current;
    const region = selectionRegion;
    if (!img || !region || !imageUrl) return null;
    return new Promise((resolve) => {
      const im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = () => {
        const natW = im.naturalWidth;
        const natH = im.naturalHeight;
        const x = Math.floor(region.x * natW);
        const y = Math.floor(region.y * natH);
        const w = Math.max(1, Math.floor(region.width * natW));
        const h = Math.max(1, Math.floor(region.height * natH));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(im, x, y, w, h, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
      };
      im.onerror = () => resolve(null);
      im.src = imageUrl;
    });
  }, [imageUrl, selectionRegion]);

  const handleMouseDown = (e) => {
    if (!imageUrl || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawing(true);
    setDrawStart({ x, y });
    setDrawCurrent({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    setDrawCurrent({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const region = getNormalizedRegion();
    setDrawStart(null);
    setDrawCurrent(null);
    if (region) {
      setSelectionRegion(region);
      requestAnimationFrame(() => {
        selectionActionBlockRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  const clearSelection = () => {
    setSelectionRegion(null);
    setSelectionAction('free');
    setSelectionText('');
  };

  const hasSelectionActionValid = () => {
    if (!selectionRegion) return false;
    if (selectionAction === 'add_text') return selectionText.trim().length > 0;
    if (selectionAction === 'remove_text' || selectionAction === 'remove_content') return true;
    if (selectionAction === 'replace') return !!replacementFile;
    if (selectionAction === 'free') return refineInstruction.trim().length > 0 || referenceArtFile || replacementFile || addImageFile;
    return false;
  };

  const hasAnyRefineAction = !!(
    (refineDimensions && refineDimensions !== '1:1') ||
    (selectionRegion ? hasSelectionActionValid() : (refineInstruction.trim() || referenceArtFile || replacementFile || addImageFile))
  );

  const handleRefineClick = async () => {
    if (!project?.id || !user?.id) {
      toast({ title: 'Selecione um projeto para refinar', variant: 'destructive' });
      return;
    }
    const instruction = refineInstruction.trim();

    setIsUploadingRefine(true);
    let referenceImageUrl = '';
    let replacementImageUrl = '';
    let addImageUrl = '';
    let regionCropImageUrl = '';
    let region = selectionRegion || undefined;

    try {
      if (referenceArtFile) {
        referenceImageUrl = await uploadNeuroDesignFile(user.id, project.id, 'refine_ref', referenceArtFile);
      }
      if (replacementFile) {
        replacementImageUrl = await uploadNeuroDesignFile(user.id, project.id, 'refine_replacement', replacementFile);
      }
      if (addImageFile) {
        addImageUrl = await uploadNeuroDesignFile(user.id, project.id, 'refine_add', addImageFile);
      }
      if (selectionRegion && imageUrl) {
        const cropBlob = await generateCropBlob();
        if (cropBlob) {
          const cropFile = new File([cropBlob], 'crop.png', { type: 'image/png' });
          regionCropImageUrl = await uploadNeuroDesignFile(user.id, project.id, 'refine_crop', cropFile);
        }
      }

      const payload = {
        instruction,
        configOverrides: { dimensions: refineDimensions },
        ...(referenceImageUrl && { referenceImageUrl }),
        ...(replacementImageUrl && { replacementImageUrl }),
        ...(addImageUrl && { addImageUrl }),
        ...(region && { region }),
        ...(regionCropImageUrl && { regionCropImageUrl }),
        ...(region && { selectionAction }),
        ...(region && selectionAction === 'add_text' && selectionText.trim() && { selectionText: selectionText.trim() }),
      };
      onRefine?.(payload);
      setRefineInstruction('');
      setSelectionText('');
      clearReferenceArt();
      clearReplacement();
      clearAddImage();
      clearSelection();
    } catch (e) {
      const msg = e?.message || String(e);
      const hint = /bucket|storage|policy|row-level|RLS|forbidden|403/i.test(msg)
        ? ' Verifique no Supabase: bucket "neurodesign" existe e as políticas de Storage estão aplicadas (veja supabase/migrations/neurodesign_storage_bucket.sql).'
        : '';
      toast({
        title: 'Erro ao enviar imagens',
        description: msg + hint,
        variant: 'destructive',
        duration: 8000,
      });
    } finally {
      setIsUploadingRefine(false);
    }
  };

  const drawBox = () => {
    if (!drawStart || !drawCurrent || !previewContainerRef.current) return null;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const w = Math.abs(drawCurrent.x - drawStart.x);
    const h = Math.abs(drawCurrent.y - drawStart.y);
    return (
      <div
        className="absolute border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
        style={{ left: x, top: y, width: w, height: h }}
      />
    );
  };

  const selectionBox = () => {
    if (!selectionRegion || !previewContainerRef.current || !previewImgRef.current) return null;
    const cRect = previewContainerRef.current.getBoundingClientRect();
    const iRect = previewImgRef.current.getBoundingClientRect();
    const imgLeft = iRect.left - cRect.left;
    const imgTop = iRect.top - cRect.top;
    return (
      <div
        className="absolute border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
        style={{
          left: imgLeft + selectionRegion.x * iRect.width,
          top: imgTop + selectionRegion.y * iRect.height,
          width: selectionRegion.width * iRect.width,
          height: selectionRegion.height * iRect.height,
        }}
      />
    );
  };

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 min-h-0 max-w-[900px] xl:max-w-[1000px] mx-auto w-full">
      <div className="flex-1 min-h-0 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden">
        {isLoading && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p>{isRefining ? 'Refinando...' : 'Gerando...'}</p>
          </div>
        )}
        {!isLoading && !imageUrl && (
          <div className="flex flex-col items-center gap-4 text-muted-foreground text-center px-6">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="h-10 w-10 text-primary/60" />
            </div>
            <p className="font-medium">Aguardando criação</p>
            <p className="text-sm">Configure o builder à esquerda e clique em &quot;Gerar Imagem&quot;.</p>
          </div>
        )}
        {!isLoading && imageUrl && (
          <div
            ref={previewContainerRef}
            className="relative w-full h-full flex flex-col items-center justify-center p-4 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={isDrawing ? handleMouseUp : undefined}
          >
            <img
              ref={previewImgRef}
              src={imageUrl}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg select-none pointer-events-none"
              draggable={false}
              style={{ touchAction: 'none' }}
            />
            {isDrawing && drawBox()}
            {!isDrawing && selectionBox()}
            {showDemoNotice && (
              <div className="mt-3 px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-700 dark:text-amber-200 text-sm text-center max-w-md">
                Modo demonstração: imagem de exemplo. Selecione uma conexão de imagem (ex.: OpenRouter) no builder para gerar imagens reais.
              </div>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setFullscreenOpen(true)}>
                <Maximize2 className="h-4 w-4 mr-1" /> Tela cheia
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onDownload?.(imageUrl)}>
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
              {selectionRegion && (
                <Button size="sm" variant="outline" onClick={clearSelection} className="border-border">
                  <Crop className="h-4 w-4 mr-1" /> Limpar seleção
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Arraste na imagem para selecionar a região a refinar. Desenhe um retângulo na área que quer alterar.</p>
          </div>
        )}
      </div>

      {/* Área rolável: O que fazer + opções avançadas + lista de criações */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        {!isLoading && imageUrl && (
          <>
            {selectionRegion ? (
              /* Bloco quando há seleção: O que fazer nesta seleção? */
              <div ref={selectionActionBlockRef} className="mt-4 space-y-3" role="region" aria-label="Ação na seleção">
                <p className="text-sm font-medium text-foreground">O que fazer nesta seleção?</p>
                <div className="flex flex-wrap gap-2">
                  {SELECTION_ACTIONS.map(({ value, label, icon: Icon }) => (
                    <Button
                      key={value}
                      type="button"
                      variant={selectionAction === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectionAction(value)}
                      className="shrink-0"
                      aria-label={label}
                      aria-pressed={selectionAction === value}
                    >
                      <Icon className="h-3.5 w-3.5 mr-1.5" />
                      {label}
                    </Button>
                  ))}
                </div>
                {selectionAction === 'add_text' && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground block">Texto a aparecer na região</label>
                    <input
                      type="text"
                      placeholder="Ex.: PLANNING 2025, slogan…"
                      value={selectionText}
                      onChange={(e) => setSelectionText(e.target.value)}
                      className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Texto a inserir na região selecionada"
                    />
                  </div>
                )}
                {selectionAction === 'remove_text' && (
                  <p className="text-xs text-muted-foreground">O texto visível na área selecionada será removido; o resto da imagem permanece.</p>
                )}
                {selectionAction === 'remove_content' && (
                  <p className="text-xs text-muted-foreground">O conteúdo da área selecionada será removido e preenchido de forma natural.</p>
                )}
                {selectionAction === 'replace' && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Imagem para substituir esta área</label>
                    <div className="flex items-center gap-2">
                      {replacementPreviewUrl ? (
                        <div className="relative">
                          <img src={replacementPreviewUrl} alt="Substituir" className="w-14 h-14 rounded object-cover border border-border" />
                          <button type="button" onClick={clearReplacement} className="absolute -top-1 -right-1 bg-foreground/80 text-background rounded-full p-0.5">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => replacementInputRef.current?.click()}
                            className="w-14 h-14 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted shrink-0"
                            aria-label="Enviar imagem para substituir"
                          >
                            <Upload className="h-4 w-4" />
                          </button>
                          <input
                            ref={replacementInputRef}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            aria-hidden
                            onChange={handleReplacementChange}
                          />
                        </>
                      )}
                      <span className="text-xs text-muted-foreground">Substitua a área selecionada por esta imagem</span>
                    </div>
                  </div>
                )}
                {selectionAction === 'free' && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground block">Instrução para a região selecionada</label>
                    <Textarea
                      ref={instructionInputRef}
                      placeholder="Descreva o ajuste na região (ex.: escureça, mude a cor…)"
                      value={refineInstruction}
                      onChange={(e) => setRefineInstruction(e.target.value)}
                      className="min-h-[60px] bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none w-full"
                      aria-label="Instrução de refinamento na região selecionada"
                    />
                  </div>
                )}
                <Button
                  onClick={handleRefineClick}
                  disabled={!hasAnyRefineAction || isUploadingRefine}
                  className="shrink-0"
                >
                  {isUploadingRefine ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                  Refinar
                </Button>
              </div>
            ) : (
              /* Bloco sem seleção: O que você quer fazer? */
              <div className="mt-4 space-y-3" role="region" aria-label="Refinamento">
                <p className="text-sm font-medium text-foreground">O que você quer fazer?</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Textarea
                    ref={instructionInputRef}
                    placeholder="Descreva o ajuste (ex.: deixe o fundo mais escuro) ou use uma imagem abaixo."
                    value={refineInstruction}
                    onChange={(e) => setRefineInstruction(e.target.value)}
                    className="flex-1 min-h-[60px] bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none min-w-0"
                    aria-label="Instrução de refinamento: descreva o ajuste ou use uma imagem abaixo"
                  />
                  <Button
                    onClick={handleRefineClick}
                    disabled={!hasAnyRefineAction || isUploadingRefine}
                    className="shrink-0"
                  >
                    {isUploadingRefine ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Refinar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Ou envie uma imagem:</p>
                <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Referência de arte</label>
                  <div className="flex items-center gap-2">
                    {referenceArtPreviewUrl ? (
                      <div className="relative">
                        <img src={referenceArtPreviewUrl} alt="Ref arte" className="w-14 h-14 rounded object-cover border border-border" />
                        <button type="button" onClick={clearReferenceArt} className="absolute -top-1 -right-1 bg-foreground/80 text-background rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => referenceArtInputRef.current?.click()}
                          className="w-14 h-14 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted shrink-0"
                          aria-label="Enviar referência de arte"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <input
                          ref={referenceArtInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          aria-hidden
                          onChange={handleReferenceArtChange}
                        />
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">Crie semelhante a essa arte</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Imagem para substituir</label>
                  <div className="flex items-center gap-2">
                    {replacementPreviewUrl ? (
                      <div className="relative">
                        <img src={replacementPreviewUrl} alt="Substituir" className="w-14 h-14 rounded object-cover border border-border" />
                        <button type="button" onClick={clearReplacement} className="absolute -top-1 -right-1 bg-foreground/80 text-background rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => replacementInputRef.current?.click()}
                          className="w-14 h-14 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted shrink-0"
                          aria-label="Enviar imagem para substituir"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <input
                          ref={replacementInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          aria-hidden
                          onChange={handleReplacementChange}
                        />
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">Substitua elemento (use seleção ou instrução)</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Imagem para adicionar na cena</label>
                  <div className="flex items-center gap-2">
                    {addImagePreviewUrl ? (
                      <div className="relative">
                        <img src={addImagePreviewUrl} alt="Adicionar" className="w-14 h-14 rounded object-cover border border-border" />
                        <button type="button" onClick={clearAddImage} className="absolute -top-1 -right-1 bg-foreground/80 text-background rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => addImageInputRef.current?.click()}
                          className="w-14 h-14 rounded border border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted shrink-0"
                          aria-label="Enviar imagem para adicionar na cena"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <input
                          ref={addImageInputRef}
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          aria-hidden
                          onChange={handleAddImageChange}
                        />
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">Inclua esta imagem na cena</span>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Opções avançadas: apenas dimensões, mais discreto */}
            <div className="mt-4 pt-3 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Opções avançadas (opcional)</p>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Dimensões</label>
                <Select value={refineDimensions} onValueChange={setRefineDimensions}>
                  <SelectTrigger className="w-[140px] h-8 bg-muted border-border text-foreground text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground">
                    {REFINE_DIMENSIONS.map((d) => (
                      <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}

        {/* Criações deste projeto: grid que desce para baixo, sem ultrapassar a largura da tela */}
        {images.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-3">Criações deste projeto</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.slice(0, 5).map((img) => {
                const url = img.url || img.thumbnail_url;
                const isSelected = selectedImage?.id === img.id;
                return (
                  <div
                    key={img.id}
                    className={cn(
                      'aspect-square rounded-lg overflow-hidden border-2 transition-all bg-muted/50',
                      isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                    )}
                  >
                    <button
                      type="button"
                      className="relative block w-full h-full focus:outline-none focus:ring-0"
                      onClick={() => onSelectImage?.(img)}
                    >
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-foreground/40 flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); onDownload?.(url); }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal tela cheia para a arte gerada */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent
          className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 gap-0 border-0 bg-background/95 dark:bg-black/95 overflow-hidden [&>button]:hidden"
          onPointerDownOutside={() => setFullscreenOpen(false)}
          onEscapeKeyDown={() => setFullscreenOpen(false)}
        >
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            className="absolute top-4 right-4 z-50 rounded-full bg-foreground/80 p-2 text-background hover:bg-foreground transition-colors"
            aria-label="Fechar tela cheia"
          >
            <X className="h-6 w-6" />
          </button>
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Arte em tela cheia"
              className="max-w-[95vw] max-h-[95vh] w-auto h-auto object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreviewPanel;
