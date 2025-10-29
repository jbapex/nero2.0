import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { v4 as uuidv4 } from 'uuid';

const ImageBankModal = ({ isOpen, onClose, projectId, onImageSelect }) => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);

  const { toast } = useToast();
  const { user } = useAuth();

  const fetchImages = useCallback(async () => {
    if (!user || !projectId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('image_bank')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });
  
    if (error) {
      toast({ title: 'Erro ao buscar imagens', description: error.message, variant: 'destructive' });
      setImages([]);
    } else {
      const imagesWithSignedUrls = await Promise.all(
        data.map(async (image) => {
          const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from('image_bank')
            .createSignedUrl(image.file_path, 3600);

          if (signedUrlError) {
            console.error('Error creating signed URL for', image.file_path, signedUrlError);
            return { ...image, signedUrl: null };
          }
          return { ...image, signedUrl: signedUrlData.signedUrl };
        })
      );
      setImages(imagesWithSignedUrls);
    }
    setIsLoading(false);
  }, [toast, user, projectId]);
  
  useEffect(() => {
    if (isOpen) {
      fetchImages();
    }
  }, [isOpen, fetchImages]);

  const handleFileChange = (event) => {
    setFilesToUpload(Array.from(event.target.files));
  };

  const handleUpload = async () => {
    if (filesToUpload.length === 0 || !user || !projectId) return;

    setIsUploading(true);
    let successCount = 0;

    for (const file of filesToUpload) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('image_bank').upload(filePath, file);

      if (uploadError) {
        toast({ title: `Erro ao enviar ${file.name}`, description: uploadError.message, variant: 'destructive' });
        continue;
      }
      
      const { data: urlData } = supabase.storage.from('image_bank').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('image_bank').insert({
        user_id: user.id,
        project_id: projectId,
        name: file.name,
        alt_text: file.name.split('.').slice(0, -1).join(' '),
        file_path: filePath,
        url: urlData.publicUrl,
      });

      if (insertError) {
        toast({ title: `Erro ao salvar metadados de ${file.name}`, description: insertError.message, variant: 'destructive' });
        await supabase.storage.from('image_bank').remove([filePath]);
      } else {
        successCount++;
      }
    }
    
    setIsUploading(false);
    setIsUploadDialogOpen(false);
    setFilesToUpload([]);
    if (successCount > 0) {
      toast({ title: "Upload Concluído", description: `${successCount} imagem(ns) enviada(s).` });
      fetchImages();
    }
  };

  const handleDelete = async () => {
    if (!imageToDelete) return;

    const { id, file_path } = imageToDelete;

    const { error: dbError } = await supabase.from('image_bank').delete().eq('id', id);
    if (dbError) {
      toast({ title: "Erro ao excluir metadados", description: dbError.message, variant: 'destructive' });
      return;
    }
    
    const { error: storageError } = await supabase.storage.from('image_bank').remove([file_path]);
    if (storageError) {
      toast({ title: "Erro ao excluir arquivo", description: storageError.message, variant: 'destructive' });
    }
    
    toast({ title: "Imagem excluída com sucesso" });
    setImages(images.filter(img => img.id !== id));
    setImageToDelete(null);
  };
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Biblioteca de Mídia do Projeto</DialogTitle>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-1 pr-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map(image => (
                  <Card key={image.id} className="group overflow-hidden relative cursor-pointer" onClick={() => onImageSelect(image)}>
                    <CardContent className="p-0">
                      {image.signedUrl ? (
                         <img src={image.signedUrl} alt={image.alt_text} className="aspect-square w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      ) : (
                        <div className="aspect-square w-full h-full bg-muted flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-2">
                        <p className="text-white text-xs font-medium truncate">{image.name}</p>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                               variant="destructive"
                               size="icon"
                               className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                               onClick={(e) => { e.stopPropagation(); setImageToDelete(image); }}
                            >
                               <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          {imageToDelete && imageToDelete.id === image.id && (
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        A imagem "{imageToDelete.name}" será excluída permanentemente.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setImageToDelete(null)}>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                        Sim, excluir
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-center p-8 border-2 border-dashed rounded-lg">
                <ImageIcon className="mx-auto h-16 w-16 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">Biblioteca Vazia</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Comece enviando sua primeira imagem para este projeto.
                </p>
              </div>
            )
          )}
        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button><Upload className="mr-2 h-4 w-4" /> Fazer Upload</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload de Imagens</DialogTitle>
              </DialogHeader>
              <div 
                  className="mt-4 flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); setFilesToUpload(Array.from(e.dataTransfer.files)); }}
                >
                  <label htmlFor="dropzone-file-modal" className="flex flex-col items-center justify-center w-full h-full">
                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste</p>
                      <input id="dropzone-file-modal" type="file" className="hidden" onChange={handleFileChange} multiple />
                  </label>
              </div>
              {filesToUpload.length > 0 && (
                  <div className="mt-4 max-h-32 overflow-y-auto">
                      <h4 className="font-semibold">Arquivos:</h4>
                      <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                          {filesToUpload.map(file => <li key={file.name} className="truncate">{file.name}</li>)}
                      </ul>
                  </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsUploadDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleUpload} disabled={isUploading || filesToUpload.length === 0}>
                  {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Enviar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageBankModal;