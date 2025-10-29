import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDebounce } from '@/hooks/use-debounce';
import { toast as sonnerToast } from 'sonner';

import ChatPanel from '@/components/site-builder/ChatPanel';
import PreviewPanel from '@/components/site-builder/PreviewPanel';
import ImageBankModal from '@/components/site-builder/ImageBankModal';

const SiteBuilder = ({ flowContext }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [project, setProject] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isImageBankOpen, setIsImageBankOpen] = useState(false);
  const selectedElementRef = useRef(null);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedHtmlContent = useDebounce(htmlContent, 1500);
  const initialLoadRef = useRef(true);

  const fetchProject = useCallback(async () => {
    if (!user || !profile) return;

    const hasPlanAccess = profile.plans?.has_site_builder_access;
    const hasIndividualAccess = profile.has_site_builder_access;

    if (profile.user_type !== 'super_admin' && !hasPlanAccess && !hasIndividualAccess) {
      toast({ title: 'Acesso Negado', description: 'Você não tem permissão para acessar o Criador de Sites.', variant: 'destructive' });
      navigate('/ferramentas');
      return;
    }

    setIsLoading(true);
    let query = supabase
      .from('site_projects')
      .select('id, name, html_content, chat_history, user_id')
      .eq('id', projectId);

    if (profile?.user_type !== 'super_admin') {
      query = query.eq('user_id', user.id);
    }
    
    const { data, error } = await query.single();

    if (error || !data) {
      toast({
        title: 'Erro ao carregar projeto',
        description: error?.message || 'Projeto não encontrado ou você não tem permissão.',
        variant: 'destructive',
      });
      const destination = profile?.user_type === 'super_admin' ? '/superadmin/criar-site' : '/ferramentas/criador-de-site';
      navigate(destination);
    } else {
      setProject(data);
      setHtmlContent(data.html_content || `
<section class="bg-gray-900 text-white">
  <div class="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center">
    <div class="mx-auto max-w-3xl text-center">
      <h1
        class="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl"
        data-id="b3f2c1a0" data-type="heading"
      >
        Sua Jornada Digital Começa Aqui.

        <span class="sm:block" data-id="b3f2c1a1" data-type="text"> Construa o Futuro. </span>
      </h1>

      <p class="mx-auto mt-4 max-w-xl sm:text-xl/relaxed" data-id="b3f2c1a2" data-type="text">
        Crie, inove e inspire. Nossas ferramentas de IA estão prontas para transformar suas ideias em realidade.
      </p>

      <div class="mt-8 flex flex-wrap justify-center gap-4">
        <a
          class="block w-full rounded border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white hover:bg-transparent hover:text-white focus:outline-none focus:ring active:text-opacity-75 sm:w-auto"
          href="#"
          data-id="b3f2c1a3" data-type="button"
        >
          Começar
        </a>

        <a
          class="block w-full rounded border border-blue-600 px-12 py-3 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring active:bg-blue-500 sm:w-auto"
          href="#"
          data-id="b3f2c1a4" data-type="button"
        >
          Saber Mais
        </a>
      </div>
    </div>
  </div>
</section>
      `);
      initialLoadRef.current = true;
    }
    setIsLoading(false);
  }, [projectId, navigate, toast, user, profile]);


  useEffect(() => {
    if (user && profile) {
      fetchProject();
    }
  }, [projectId, user, profile, fetchProject]);

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  const updateProjectInDb = useCallback(async (updates, showToast = false) => {
    setIsSaving(true);
    if (showToast) {
        sonnerToast.loading('Salvando alterações...', { id: 'autosave-toast', icon: <Save className="w-4 h-4 animate-pulse" /> });
    }
    const { error } = await supabase
      .from('site_projects')
      .update(updates)
      .eq('id', projectId);
    
    setIsSaving(false);
    if (error) {
      if (showToast) {
        sonnerToast.error('Erro ao salvar progresso', { id: 'autosave-toast', description: 'Não foi possível salvar as últimas alterações.' });
      } else {
        toast({
          title: 'Erro ao salvar progresso',
          description: 'Não foi possível salvar as últimas alterações.',
          variant: 'destructive',
        });
      }
    } else if (showToast) {
        sonnerToast.success('Salvo com sucesso!', { id: 'autosave-toast', duration: 2000 });
    }
  }, [projectId, toast]);

  useEffect(() => {
    if (initialLoadRef.current) {
        initialLoadRef.current = false;
        return;
    }
    if (debouncedHtmlContent) {
        updateProjectInDb({ html_content: debouncedHtmlContent }, true);
    }
  }, [debouncedHtmlContent, updateProjectInDb]);

  const onImageSelect = (image) => {
    const currentSelectedElement = selectedElementRef.current;
    if (!currentSelectedElement || currentSelectedElement.type !== 'image') {
      toast({
        title: 'Nenhuma imagem selecionada no editor',
        description: 'Por favor, clique em uma imagem na página para substituí-la.',
        variant: 'destructive',
      });
      return;
    }

    const { signedUrl } = image;
    
    setHtmlContent(prevContent => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = prevContent;
        const imgToUpdate = tempDiv.querySelector(`img[data-id="${currentSelectedElement.dataId}"]`);
        
        if (imgToUpdate) {
            imgToUpdate.src = signedUrl;
            imgToUpdate.alt = image.alt_text || '';
            toast({ title: 'Imagem atualizada com sucesso!' });
            return tempDiv.innerHTML;
        } else {
            toast({
                title: 'Erro ao atualizar imagem',
                description: 'Não foi possível encontrar o elemento da imagem na estrutura da página.',
                variant: 'destructive',
            });
            return prevContent;
        }
    });

    setIsImageBankOpen(false);
    setSelectedElement(null);
  };

  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`Editor: ${project?.name || 'Criador de Sites'}`}</title>
        <meta name="description" content="Crie e edite landing pages usando uma interface de chat com preview em tempo real." />
      </Helmet>
      <div className="flex flex-col h-screen bg-background text-foreground">
         <header className="p-2 border-b flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate(profile.user_type === 'super_admin' ? '/superadmin/criar-site' : '/ferramentas/criador-de-site')}>
              <ArrowLeft className="h-5 w-5" />
           </Button>
           <h1 className="text-lg font-semibold">{project.name}</h1>
         </header>
        <ResizablePanelGroup direction="horizontal" className="flex-grow">
          <ResizablePanel defaultSize={40} minSize={30}>
            <ChatPanel
              htmlContent={htmlContent}
              setHtmlContent={setHtmlContent}
              setIsBuilding={setIsBuilding}
              flowContext={flowContext}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={30}>
            <PreviewPanel
              htmlContent={htmlContent}
              setHtmlContent={setHtmlContent}
              selectedElement={selectedElement}
              setSelectedElement={setSelectedElement}
              onOpenImageBank={() => setIsImageBankOpen(true)}
              isBuilding={isBuilding}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <ImageBankModal
        isOpen={isImageBankOpen}
        onClose={() => {
          setIsImageBankOpen(false);
          setSelectedElement(null);
        }}
        projectId={projectId}
        onImageSelect={onImageSelect}
      />
    </>
  );
};

export default SiteBuilder;