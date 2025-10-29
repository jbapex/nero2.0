import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import DownloaderCard from '@/components/media-center/DownloaderCard';
import TranscriberCard from '@/components/media-center/TranscriberCard';
import LibraryList from '@/components/media-center/LibraryList';

const WhisperTranscriber = () => {
  const [library, setLibrary] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [transcribingId, setTranscribingId] = useState(null);
  const { toast } = useToast();

  const fetchLibrary = useCallback(async () => {
    setLoadingLibrary(true);
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLibrary(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar biblioteca', description: error.message, variant: 'destructive' });
    } finally {
      setLoadingLibrary(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLibrary();
    const channel = supabase.channel('media_library_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media_library' }, fetchLibrary)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLibrary]);

  const handleTranscribeFromLibrary = async (mediaId) => {
    setTranscribingId(mediaId);
    try {
      const { error } = await supabase.functions.invoke('video-transcriber', {
        body: { media_id: mediaId },
      });
      if (error) throw new Error(error.message);
      toast({ title: 'Transcrição iniciada!', description: 'O resultado aparecerá em breve.' });
    } catch (error) {
      toast({ title: 'Erro ao iniciar transcrição', description: error.message, variant: 'destructive' });
      setTranscribingId(null);
    }
  };

  const handleDelete = async (mediaId) => {
    try {
      const { error } = await supabase.from('media_library').delete().eq('id', mediaId);
      if (error) throw error;
      toast({ title: 'Item removido', description: 'O vídeo foi removido da sua biblioteca.' });
    } catch (error) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Mídia Center - Transcrição e Download</title>
        <meta name="description" content="Baixe vídeos do YouTube/Instagram e transcreva-os com a tecnologia Whisper da OpenAI." />
      </Helmet>
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mídia Center</h1>
          <p className="text-muted-foreground mt-1">Capture, baixe e transcreva vídeos de forma fácil e intuitiva.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <DownloaderCard />
          <TranscriberCard transcribingId={transcribingId} setTranscribingId={setTranscribingId} />
        </div>

        <LibraryList 
          library={library}
          loading={loadingLibrary}
          transcribingId={transcribingId}
          onTranscribe={handleTranscribeFromLibrary}
          onDelete={handleDelete}
        />
      </div>
    </>
  );
};

export default WhisperTranscriber;