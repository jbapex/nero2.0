import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, DownloadCloud } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { motion, AnimatePresence } from 'framer-motion';

const DownloaderCard = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [metaData, setMetaData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const debouncedUrl = useDebounce(videoUrl, 500);

  const handleFetchMetadata = useCallback(async (url) => {
    if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be') && !url.includes('instagram.com'))) {
      setMetaData(null);
      return;
    }
    setIsFetchingMeta(true);
    setMetaData(null);
    try {
      const { data, error } = await supabase.functions.invoke('get-video-metadata', {
        body: { video_url: url },
      });

      if (error) {
        const errorContext = error.context || {};
        // Check if context has a json method before calling it.
        const errorBody = typeof errorContext.json === 'function' ? await errorContext.json() : { error: 'Erro ao buscar metadados.'};
        throw new Error(errorBody.error || 'Erro desconhecido ao buscar metadados.');
      }
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMetaData(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar dados do vídeo', description: error.message, variant: 'destructive' });
      setMetaData(null);
    } finally {
      setIsFetchingMeta(false);
    }
  }, [toast]);

  useEffect(() => {
    handleFetchMetadata(debouncedUrl);
  }, [debouncedUrl, handleFetchMetadata]);

  const handleSaveToLibrary = async () => {
    if (!metaData || !debouncedUrl) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('media_library').insert({
        video_url: debouncedUrl,
        platform: debouncedUrl.includes('instagram') ? 'instagram' : 'youtube',
        title: metaData.title,
        thumbnail_url: metaData.thumbnail,
      });
      if (error) throw error;
      toast({ title: 'Vídeo salvo!', description: 'O vídeo foi adicionado à sua biblioteca.' });
      setVideoUrl('');
      setMetaData(null);
    } catch (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DownloadCloud className="h-6 w-6 text-primary" /> Downloader de Vídeos</CardTitle>
        <CardDescription>Cole uma URL do YouTube ou Instagram para salvar o vídeo em sua biblioteca.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="pl-10"
          />
        </div>
        <AnimatePresence>
          {isFetchingMeta && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Buscando dados do vídeo...
            </motion.div>
          )}
          {metaData && !isFetchingMeta && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/50">
                <img-replace src={metaData.thumbnail} alt={`Thumbnail for ${metaData.title}`} className="w-32 h-20 object-cover rounded-md" />
                <div className="flex-1">
                  <p className="font-semibold line-clamp-2">{metaData.title}</p>
                  <p className="text-sm text-muted-foreground">{metaData.uploader}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveToLibrary} disabled={isSaving || !metaData} className="w-full">
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
          Salvar na Biblioteca
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DownloaderCard;