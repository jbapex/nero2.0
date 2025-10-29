import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Library, UploadCloud, Video, Trash2 } from 'lucide-react';
import LibraryModal from '@/components/media-center/LibraryModal';
import { v4 as uuidv4 } from 'uuid';

function sanitizeFilename(filename) {
  const extension = filename.split('.').pop();
  const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.'));
  
  const sanitized = nameWithoutExtension
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters (except spaces and hyphens)
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .substring(0, 50); // Truncate to 50 chars

  return `${sanitized}.${extension}`;
}

const TranscriberCard = ({ transcribingId, setTranscribingId }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

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
    } finally {
      setSelectedFile(null);
    }
  };
  
  const handleUploadAndTranscribe = async (file) => {
    setIsUploading(true);
    setTranscribingId('local_upload');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');
      
      const sanitizedName = sanitizeFilename(file.name);
      const fileName = `${user.id}/${uuidv4()}-${sanitizedName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('media_uploads')
        .upload(fileName, file);

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      const { data: newMedia, error: insertError } = await supabase
        .from('media_library')
        .insert({
          user_id: user.id,
          title: file.name,
          platform: 'upload',
          storage_path: fileName,
          video_url: null,
        })
        .select()
        .single();
      
      if (insertError) {
        throw new Error(`Erro ao salvar na biblioteca: ${insertError.message}`);
      }
      
      toast({ title: 'Upload concluído!', description: 'Iniciando a transcrição do arquivo.' });
      await handleTranscribeFromLibrary(newMedia.id);

    } catch (error) {
      toast({ title: 'Erro na transcrição do arquivo', description: error.message, variant: 'destructive' });
      setTranscribingId(null);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleSelectFromLibrary = (item) => {
    setSelectedFile(item);
    setIsLibraryModalOpen(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile({ isLocalFile: true, file, title: file.name });
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({ title: 'Nenhum vídeo selecionado', description: 'Por favor, selecione um vídeo da biblioteca ou envie um arquivo.', variant: 'destructive' });
      return;
    }
    if (selectedFile.isLocalFile) {
      handleUploadAndTranscribe(selectedFile.file);
    } else {
      handleTranscribeFromLibrary(selectedFile.id);
    }
  };
  
  const isBusy = transcribingId !== null || isUploading;
  const currentActionIsSelected = isUploading || transcribingId === selectedFile?.id;

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Transcritor de Vídeos</CardTitle>
          <CardDescription>Selecione um vídeo da sua biblioteca ou envie um arquivo para transcrever.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex-grow">
          <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/50 flex flex-col items-center justify-center h-full">
            {selectedFile ? (
              <div className="flex items-center gap-3">
                <Video className="h-8 w-8 text-primary" />
                <p className="font-semibold truncate">{selectedFile.title}</p>
                <Button variant="ghost" size="icon" onClick={() => setSelectedFile(null)} disabled={isBusy}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-muted-foreground">Arraste um arquivo ou selecione uma opção</p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setIsLibraryModalOpen(true)} disabled={isBusy}>
                    <Library className="mr-2 h-4 w-4" />
                    Da Biblioteca
                  </Button>
                  <Button variant="outline" onClick={() => document.getElementById('file-upload').click()} disabled={isBusy}>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Enviar Arquivo
                  </Button>
                  <input type="file" id="file-upload" className="hidden" accept="video/*,audio/*" onChange={handleFileChange} />
                </div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedFile || !currentActionIsSelected && isBusy}
            className="w-full"
          >
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
             (currentActionIsSelected && isBusy) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
             <FileText className="mr-2 h-4 w-4" />}
            {isUploading ? 'Enviando...' : (currentActionIsSelected && isBusy) ? 'Processando...' : 'Transcrever Vídeo Selecionado'}
          </Button>
        </CardFooter>
      </Card>
      <LibraryModal 
        isOpen={isLibraryModalOpen}
        onOpenChange={setIsLibraryModalOpen}
        onSelect={handleSelectFromLibrary}
      />
    </>
  );
};

export default TranscriberCard;