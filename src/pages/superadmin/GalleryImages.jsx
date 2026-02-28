import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, RefreshCcw } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PAGE_SIZE = 40;

const GalleryImages = () => {
  const { toast } = useToast();
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const loadImages = useCallback(
    async (reset = false) => {
      const isFirstLoad = reset || images.length === 0;
      if (isFirstLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const limit = Math.max(1, Math.min(100, Number(PAGE_SIZE) || 50));
        const offset = Math.max(0, reset ? 0 : Number(images.length) || 0);
        const params = {
          p_source: sourceFilter === 'all' ? null : sourceFilter,
          p_search_text: (searchText && String(searchText).trim()) ? String(searchText).trim() : null,
          p_from_date: (fromDate && String(fromDate).trim()) ? String(fromDate).trim() : null,
          p_to_date: (toDate && String(toDate).trim()) ? String(toDate).trim() : null,
          p_limit: limit,
          p_offset: offset,
        };
        const { data, error } = await supabase.rpc('get_superadmin_gallery_images', params);

        if (error) {
          toast({
            title: 'Erro ao carregar imagens',
            description: error.message,
            variant: 'destructive',
          });
          if (reset) {
            setImages([]);
          }
          setHasMore(false);
          return;
        }

        const list = data || [];
        if (reset) {
          setImages(list);
        } else {
          setImages((prev) => [...prev, ...list]);
        }
        setHasMore(list.length === PAGE_SIZE);
      } catch (e) {
        toast({
          title: 'Erro ao carregar imagens',
          description: e?.message || 'Não foi possível buscar a galeria.',
          variant: 'destructive',
        });
        if (reset) {
          setImages([]);
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [images.length, sourceFilter, searchText, fromDate, toDate, toast]
  );

  useEffect(() => {
    loadImages(true);
  }, [loadImages]);

  const handleApplyFilters = (e) => {
    e?.preventDefault();
    loadImages(true);
  };

  const handleClearFilters = () => {
    setSourceFilter('all');
    setSearchText('');
    setFromDate('');
    setToDate('');
    loadImages(true);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <ImageIcon className="h-6 w-6 text-primary" />
            Galeria de Imagens
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Visualize todas as imagens geradas no sistema (NeuroDesign e Criador de Site).
          </p>
        </div>
      </motion.div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm md:text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleApplyFilters}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
          >
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Origem
              </span>
              <Select
                value={sourceFilter}
                onValueChange={(v) => setSourceFilter(v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as origens" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="neurodesign">NeuroDesign</SelectItem>
                  <SelectItem value="site">Criador de Site</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Buscar (usuário ou projeto)
              </span>
              <Input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Nome ou e-mail do usuário, nome do projeto..."
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Data inicial
              </span>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">
                Data final
              </span>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-4 mt-2">
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="gap-2"
              >
                {loading && (
                  <span className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                )}
                Aplicar filtros
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleClearFilters}
                className="gap-2"
              >
                <RefreshCcw className="h-3 w-3" />
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="border rounded-lg p-3 md:p-4 bg-card">
        {images.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <ImageIcon className="h-10 w-10 mb-3" />
            <p className="font-medium">Nenhuma imagem encontrada.</p>
            <p className="text-xs mt-1">
              Ajuste os filtros ou gere novas imagens para que apareçam aqui.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className="group relative rounded-lg overflow-hidden border bg-background focus:outline-none focus:ring-2 focus:ring-primary/60"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-muted">
                    <img
                      src={img.thumbnail_url || img.image_url}
                      alt={img.project_name || 'Imagem gerada'}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2 flex flex-col gap-1 text-left">
                    <p className="text-xs font-medium truncate">
                      {img.project_name || 'Sem nome'}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {img.owner_email || img.owner_user_id}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="uppercase tracking-wide">
                        {img.source === 'site' ? 'Site' : 'NeuroDesign'}
                      </span>
                      <span>
                        {img.created_at
                          ? new Date(img.created_at).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadImages(false)}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore && (
                    <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                  Carregar mais
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-3xl">
          {selectedImage && (
            <>
              <DialogHeader>
                <DialogTitle>Detalhes da Imagem</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={selectedImage.image_url}
                    alt={selectedImage.project_name || 'Imagem gerada'}
                    className="w-full h-full object-contain bg-black/5"
                  />
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="font-semibold">Origem: </span>
                    {selectedImage.source === 'site' ? 'Criador de Site' : 'NeuroDesign'}
                  </p>
                  <p>
                    <span className="font-semibold">Projeto: </span>
                    {selectedImage.project_name || selectedImage.project_id}
                  </p>
                  <p>
                    <span className="font-semibold">Usuário: </span>
                    {selectedImage.owner_email || selectedImage.owner_user_id}
                  </p>
                  <p>
                    <span className="font-semibold">Criada em: </span>
                    {selectedImage.created_at
                      ? new Date(selectedImage.created_at).toLocaleString()
                      : '—'}
                  </p>
                  <p>
                    <span className="font-semibold">Dimensões: </span>
                    {selectedImage.width && selectedImage.height
                      ? `${selectedImage.width}×${selectedImage.height}`
                      : 'Não informado'}
                  </p>
                  <p className="break-all">
                    <span className="font-semibold">URL: </span>
                    {selectedImage.image_url}
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GalleryImages;

