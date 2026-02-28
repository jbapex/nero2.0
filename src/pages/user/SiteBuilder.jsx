import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Helmet } from 'react-helmet';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import ChatPanel from '@/components/site-builder/ChatPanel';
import PreviewPanel from '@/components/site-builder/PreviewPanel';
import ImageBankModal from '@/components/site-builder/ImageBankModal';

const SiteBuilder = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isImageBankOpen, setIsImageBankOpen] = useState(false);
  const [textEditElement, setTextEditElement] = useState(null); // { dataId, dataType, textContent } para popover de edição
  const [textEditValue, setTextEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [llmConnections, setLlmConnections] = useState([]);
  const [selectedLlmId, setSelectedLlmId] = useState(null);
  const selectedElementRef = useRef(null);

  const handleSaveProject = useCallback(async () => {
    if (!projectId || !user) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('site_projects')
      .update({ html_content: htmlContent, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .eq('user_id', user.id);
    setIsSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Projeto salvo!' });
    }
  }, [projectId, user, htmlContent, toast]);

  const fetchProject = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('site_projects')
      .select('id, name, html_content, chat_history')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      toast({
        title: 'Erro ao carregar projeto',
        description: error?.message || 'Projeto não encontrado ou você não tem permissão.',
        variant: 'destructive',
      });
      navigate('/ferramentas/criador-de-site');
    } else {
      setProject(data);
      setChatHistory(Array.isArray(data.chat_history) ? data.chat_history : []);
      setHtmlContent(data.html_content || `
<section class="bg-gray-900 text-white">
  <div class="mx-auto max-w-screen-xl px-4 py-32 lg:flex lg:h-screen lg:items-center">
    <div class="mx-auto max-w-3xl text-center">
      <h1 class="bg-gradient-to-r from-green-300 via-blue-500 to-purple-600 bg-clip-text text-3xl font-extrabold text-transparent sm:text-5xl" data-id="b3f2c1a0" data-type="heading">
        Sua Jornada Digital Começa Aqui.
        <span class="sm:block" data-id="b3f2c1a1" data-type="text"> Construa o Futuro. </span>
      </h1>
      <p class="mx-auto mt-4 max-w-xl sm:text-xl/relaxed" data-id="b3f2c1a2" data-type="text">
        Crie, inove e inspire. Nossas ferramentas de IA estão prontas para transformar suas ideias em realidade.
      </p>
      <div class="mt-8 flex flex-wrap justify-center gap-4">
        <a class="block w-full rounded border border-blue-600 bg-blue-600 px-12 py-3 text-sm font-medium text-white sm:w-auto" href="#" data-id="b3f2c1a3" data-type="button">Começar</a>
        <a class="block w-full rounded border border-blue-600 px-12 py-3 text-sm font-medium text-white sm:w-auto" href="#" data-id="b3f2c1a4" data-type="button">Saber Mais</a>
      </div>
    </div>
  </div>
</section>
      `);
    }
    setIsLoading(false);
  }, [projectId, user, navigate, toast]);

  const fetchLlmConnections = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_ai_connections')
        .select('id, name, provider, capabilities')
        .eq('user_id', user.id);
      if (error) return;
      const list = (data || []).filter((c) => c.capabilities?.text_generation === true);
      setLlmConnections(list);
      setSelectedLlmId((prev) => (list.length > 0 && (!prev || !list.some((c) => c.id === prev)) ? list[0].id : prev));
    } catch (_e) {
      setLlmConnections([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchProject();
  }, [user, fetchProject]);

  useEffect(() => {
    if (user) fetchLlmConnections();
  }, [user, fetchLlmConnections]);

  useEffect(() => {
    selectedElementRef.current = selectedElement;
  }, [selectedElement]);

  useEffect(() => {
    const handler = (event) => {
      const d = event.data;
      if (d?.type !== 'site-preview-click' || !d.dataId) return;
      const dataType = (d.dataType || 'text').toLowerCase();
      setSelectedElement({ type: dataType, dataId: d.dataId });
      if (dataType === 'image') {
        setIsImageBankOpen(true);
      } else if (['heading', 'text', 'button'].includes(dataType)) {
        const initial = d.textContent != null ? String(d.textContent) : '';
        setTextEditElement({
          dataId: d.dataId,
          dataType,
          textContent: initial,
        });
        setTextEditValue(initial);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const HORIZONS_SYSTEM_PROMPT = `Você é o Horizons, assistente de criação de sites. Ajude o usuário a construir landing pages. Quando gerar ou sugerir conteúdo de página, retorne o HTML completo (ou o trecho) dentro de um bloco de código marcado assim: \`\`\`html
... seu HTML aqui ...
\`\`\`
Assim o sistema pode aplicar no preview. Seja conciso nas respostas de texto e priorize gerar HTML quando o usuário pedir uma seção, hero, card ou página.`;

  const extractHtmlFromChatResponse = (text) => {
    if (!text || typeof text !== 'string') return null;
    // Fechamento tolerante: ``` seguido de espaço, quebra de linha ou fim da string
    const htmlBlock = text.match(/```html\s*([\s\S]*?)```(?=\s|$)/i);
    if (htmlBlock && htmlBlock[1]) return htmlBlock[1].trim();
    const anyBlock = text.match(/```\s*([\s\S]*?)```(?=\s|$)/);
    if (anyBlock && anyBlock[1] && /<\s*[a-z][\s\S]*>/i.test(anyBlock[1])) return anyBlock[1].trim();
    // Fallback: inclui footer, header e nav para páginas que começam com esses blocos
    const startMatch = text.match(/<\s*(section|div|article|main|footer|header|nav)\b[\s\S]*?>/i);
    if (startMatch) {
      const tagName = startMatch[1].toLowerCase();
      const start = text.indexOf(startMatch[0]);
      const limit = 150000;
      let depth = 1;
      let pos = start + startMatch[0].length;
      const openTag = `<${tagName}`;
      const openTagLen = openTag.length;
      const closeTag = `</${tagName}>`;
      const closeTagLen = closeTag.length;
      while (pos < text.length && pos < start + limit) {
        const nextOpen = text.toLowerCase().indexOf(openTag.toLowerCase(), pos);
        const nextClose = text.indexOf(closeTag, pos);
        if (nextClose === -1) break;
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          pos = nextOpen + openTagLen;
        } else {
          depth--;
          pos = nextClose + closeTagLen;
          if (depth <= 0) {
            const extracted = text.slice(start, pos).trim();
            if (extracted.length > 30) return extracted;
            return null;
          }
        }
      }
    }
    return null;
  };

  const CHAT_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

  const onSendMessage = useCallback(async (userMessage) => {
    const trimmed = (userMessage || '').trim();
    if (!trimmed || !projectId || !user) return;
    const connId = selectedLlmId || llmConnections[0]?.id;
    if (!connId) {
      toast({ title: 'Configure uma conexão de IA', description: 'Vá em Minha IA e configure uma conexão de modelo de linguagem para usar o chat.', variant: 'destructive' });
      return;
    }
    setIsSendingChat(true);
    const newUserMsg = { role: 'user', content: trimmed };
    setChatHistory((prev) => [...prev, newUserMsg]);
    const timeoutSignal = typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(CHAT_TIMEOUT_MS) : null;
    try {
      const messages = [
        { role: 'system', content: HORIZONS_SYSTEM_PROMPT },
        ...chatHistory,
        newUserMsg,
      ];
      const invokeOptions = {
        body: JSON.stringify({
          session_id: null,
          messages,
          llm_integration_id: connId,
          is_user_connection: true,
          context: 'site_builder_chat',
        }),
      };
      if (timeoutSignal) invokeOptions.signal = timeoutSignal;
      const { data, error } = await supabase.functions.invoke('generic-ai-chat', invokeOptions);
      if (error) throw new Error(error.message || error);
      if (data?.error) throw new Error(data.error);
      const raw = data?.response || data?.content || '';
      const assistantMsg = { role: 'assistant', content: raw };
      setChatHistory((prev) => [...prev, assistantMsg]);
      const extractedHtml = extractHtmlFromChatResponse(raw);
      if (extractedHtml) {
        setHtmlContent(extractedHtml);
        const updatedHistory = [...chatHistory, newUserMsg, assistantMsg];
        await supabase
          .from('site_projects')
          .update({
            html_content: extractedHtml,
            chat_history: updatedHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId)
          .eq('user_id', user.id);
      } else {
        const updatedHistory = [...chatHistory, newUserMsg, assistantMsg];
        await supabase
          .from('site_projects')
          .update({
            chat_history: updatedHistory,
            updated_at: new Date().toISOString(),
          })
          .eq('id', projectId)
          .eq('user_id', user.id);
        toast({
          title: 'Nenhum HTML na resposta',
          description: 'Não foi encontrado um bloco de código HTML na resposta. Peça ao assistente para gerar o site usando o formato com ```html ... ```',
          variant: 'default',
        });
      }
    } catch (e) {
      setChatHistory((prev) => prev.slice(0, -1));
      const isTimeout = e?.name === 'AbortError' || /timeout|abort/i.test(e?.message || '');
      if (isTimeout) {
        toast({
          title: 'Limite de tempo excedido',
          description: 'A geração foi interrompida após 5 minutos. Tente novamente ou use um pedido mais curto.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Erro no chat', description: e?.message || 'Não foi possível enviar a mensagem.', variant: 'destructive' });
      }
    } finally {
      setIsSendingChat(false);
    }
  }, [projectId, user, chatHistory, selectedLlmId, llmConnections, toast]);

  const saveTextEdit = useCallback((newText) => {
    if (!textEditElement) return;
    const { dataId } = textEditElement;
    const valueToSave = newText != null ? String(newText) : textEditElement.textContent;
    setHtmlContent((prev) => {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = prev;
      const el = tempDiv.querySelector(`[data-id="${dataId}"]`);
      if (el) {
        el.textContent = valueToSave;
        return tempDiv.innerHTML;
      }
      return prev;
    });
    setTextEditElement(null);
    setSelectedElement(null);
    toast({ title: 'Texto atualizado!' });
  }, [textEditElement, toast]);

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
      }
      toast({ title: 'Erro ao atualizar imagem', variant: 'destructive' });
      return prevContent;
    });
    setIsImageBankOpen(false);
    setSelectedElement(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-16 h-16 text-primary animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  return (
    <>
      <Helmet>
        <title>{`Editor: ${project?.name || 'Criador de Sites'}`}</title>
        <meta name="description" content="Crie e edite landing pages usando uma interface de chat com preview em tempo real." />
      </Helmet>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="p-2 border-b flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/ferramentas/criador-de-site')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{project.name}</h1>
        </header>
        <ResizablePanelGroup direction="horizontal" className="flex-grow min-h-0 overflow-hidden">
          <ResizablePanel defaultSize={40} minSize={20} className="min-h-0">
            <ChatPanel
              htmlContent={htmlContent}
              setHtmlContent={setHtmlContent}
              chatHistory={chatHistory}
              onSendMessage={onSendMessage}
              isSendingChat={isSendingChat}
              llmConnections={llmConnections}
              selectedLlmId={selectedLlmId}
              setSelectedLlmId={setSelectedLlmId}
              setIsBuilding={setIsBuilding}
              onSaveProject={handleSaveProject}
              isSaving={isSaving}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={20} className="min-h-0 flex flex-col overflow-hidden">
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
      <Dialog open={!!textEditElement} onOpenChange={(open) => { if (!open) { setTextEditElement(null); setSelectedElement(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar texto</DialogTitle>
          </DialogHeader>
          <Textarea
            value={textEditValue}
            onChange={(e) => setTextEditValue(e.target.value)}
            placeholder="Texto do elemento"
            className="min-h-[120px]"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTextEditElement(null); setSelectedElement(null); }}>
              Cancelar
            </Button>
            <Button onClick={() => saveTextEdit(textEditValue)}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SiteBuilder;
