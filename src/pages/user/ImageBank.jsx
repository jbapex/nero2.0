import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image as ImageIcon, Loader2, Trash2, Copy, MoreVertical, X } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { v4 as uuidv4 } from 'uuid';

const ImageBank = () => {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchImages = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('image_bank')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao buscar imagens', description: error.message, variant: 'destructive' });
    } else {
      setImages(data);
    }
    setIsLoading(false);
  }, [toast, user]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleFileChange = (event) => {
    setFilesToUpload(Array.from(event.target.files));
  };
  
  const handleDragOver = (event) => {
    event.preventDefault();
  };
  
  const handleDrop = (event) => {
    event.preventDefault();
    setFilesToUpload(Array.from(event.dataTransfer.files));
  };

  const handleUpload = async () => {
    if (filesToUpload.length === 0) {
      toast({ title: "Nenhum arquivo selecionado", description: "Por favor, selecione ao menos uma imagem.", variant: "destructive" });
      return;
    }
    if (!user) return;

    setIsUploading(true);
    let successCount = 0;

    for (const file of filesToUpload) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('image_bank')
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: `Erro ao enviar ${file.name}`, description: uploadError.message, variant: 'destructive' });
        continue;
      }
      
      const { data: { publicUrl } } = supabase.storage.from('image_bank').getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('image_bank')
        .insert({
          user_id: user.id,
          name: file.name,
          alt_text: file.name.split('.').slice(0, -1).join(' '),
          file_path: filePath,
          url: publicUrl,
        });

      if (insertError) {
        toast({ title: `Erro ao salvar ${file.name}`, description: insertError.message, variant: 'destructive' });
        await supabase.storage.from('image_bank').remove([filePath]); // Rollback storage upload
      } else {
        successCount++;
      }
    }
    
    setIsUploading(false);
    setIsDialogOpen(false);
    setFilesToUpload([]);
    if (successCount > 0) {
        toast({ title: "Upload Concluído", description: `${successCount} imagem(ns) enviada(s) com sucesso.` });
        fetchImages();
    }
  };

  const handleDelete = async (imageId, filePath) => {
    const { error: dbError } = await supabase
      .from('image_bank')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      toast({ title: "Erro ao excluir do banco de dados", description: dbError.message, variant: 'destructive' });
      return;
    }
    
    const { error: storageError } = await supabase.storage
      .from('image_bank')
      .remove([filePath]);

    if (storageError) {
      toast({ title: "Erro ao excluir do armazenamento", description: storageError.message, variant: 'destructive' });
    }
    
    toast({ title: "Imagem excluída com sucesso" });
    setImages(images.filter(img => img.id !== imageId));
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    toast({ title: "URL copiada para a área de transferência!" });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <>
      <Helmet>
        <title>Banco de Imagens</title>
        <meta name="description" content="Gerencie seu banco de imagens pessoal." />
      </Helmet>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Banco de Imagens</h1>
            <p className="text-muted-foreground mt-1">Gerencie suas imagens para usar no sistema.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 sm:mt-0">
                <Upload className="mr-2 h-4 w-4" /> Fazer Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Upload de Imagens</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                 <div 
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-full">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span> ou arraste e solte</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF, WEBP ou SVG (MAX. 5MB)</p>
                        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} multiple />
                    </label>
                </div>
                {filesToUpload.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold">Arquivos selecionados:</h4>
                        <ul className="mt-2 text-sm text-muted-foreground list-disc list-inside">
                            {filesToUpload.map(file => <li key={file.name}>{file.name}</li>)}
                        </ul>
                    </div>
                )}
              </div>
               <AlertDialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isUploading}>Cancelar</Button>
                <Button onClick={handleUpload} disabled={isUploading || filesToUpload.length === 0}>
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar {filesToUpload.length > 0 ? `(${filesToUpload.length})` : ''}
                </Button>
              </AlertDialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <AnimatePresence>
            {images.length > 0 ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {images.map(image => (
                  <motion.div key={image.id} variants={itemVariants}>
                    <Card className="group overflow-hidden relative">
                      <CardContent className="p-0">
                        <img  src={image.url} alt={image.alt_text} className="aspect-square w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" src="https://images.unsplash.com/photo-1558798516-8f5a6bbfab8c" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-2">
                           <div className="absolute top-1 right-1">
                             <AlertDialog>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="icon" className="h-7 w-7 bg-black/50 hover:bg-black/70 border-none">
                                        <MoreVertical className="h-4 w-4 text-white"/>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent>
                                    <DropdownMenuItem onClick={() => handleCopyUrl(image.url)}>
                                        <Copy className="mr-2 h-4 w-4" /> Copiar URL
                                    </DropdownMenuItem>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. A imagem será excluída permanentemente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(image.id, image.file_path)} className="bg-destructive hover:bg-destructive/90">
                                            Sim, excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                             </AlertDialog>
                            </div>
                           <p className="text-white text-xs font-medium truncate">{image.name}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16 border-2 border-dashed rounded-lg"
              >
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Nenhuma imagem encontrada</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Comece enviando sua primeira imagem para vê-la aqui.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </>
  );
};

export default ImageBank;