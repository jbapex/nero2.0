import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, MessageSquare, Code, GripVertical, LayoutList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Extrai seções (nós de primeiro nível) do htmlContent para reordenação. */
function parseSections(html) {
  if (!html || typeof html !== 'string') return [];
  const div = document.createElement('div');
  div.innerHTML = html.trim();
  return Array.from(div.children).map((el, i) => {
    const sectionId = el.getAttribute('data-section-id') || el.id;
    const label = sectionId || `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/)[0] : ''}` || `Seção ${i + 1}`;
    return { id: `section-${i}`, index: i, html: el.outerHTML, label: String(label).slice(0, 40) };
  });
}

function SortableSectionItem({ section, disabled }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    disabled,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 rounded-md border bg-card text-sm',
        isDragging && 'opacity-80 z-10 shadow'
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab touch-none p-1 text-muted-foreground">
        <GripVertical className="w-4 h-4" />
      </div>
      <span className="truncate flex-1">{section.label}</span>
    </div>
  );
}

/**
 * Painel do Criador de Site: módulos (pageStructure) ou edição HTML (htmlContent).
 * No modo htmlContent com chat: abas "Chat com IA" e "Editar HTML".
 */
const ChatPanel = ({
  pageStructure,
  setPageStructure,
  htmlContent,
  setHtmlContent,
  chatHistory,
  onSendMessage,
  isSendingChat,
  llmConnections = [],
  selectedLlmId,
  setSelectedLlmId,
  setIsBuilding,
  flowContext,
  selectedElement,
  setSelectedElement,
  onOpenImageBank,
  isBuilding,
  onSaveProject,
  isSaving,
}) => {
  const isHtmlMode = htmlContent != null && setHtmlContent != null;
  const hasChat = isHtmlMode && Array.isArray(chatHistory) && typeof onSendMessage === 'function';
  const [activeTab, setActiveTab] = useState(hasChat ? 'chat' : 'html');
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef(null);

  const sections = useMemo(() => parseSections(htmlContent || ''), [htmlContent]);

  const handleSectionsDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !setHtmlContent) return;
      const oldIds = sections.map((s) => s.id);
      const oldIndex = oldIds.indexOf(active.id);
      const newIndex = oldIds.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      const reordered = arrayMove(sections, oldIndex, newIndex);
      const newHtml = reordered.map((s) => s.html).join('\n');
      setHtmlContent(newHtml);
    },
    [sections, setHtmlContent]
  );

  useEffect(() => {
    if (hasChat) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, hasChat]);

  const handleSendChat = () => {
    const t = (chatInput || '').trim();
    if (!t || isSendingChat) return;
    onSendMessage(t);
    setChatInput('');
  };

  if (!isHtmlMode) {
    return (
      <div className="flex flex-col h-full p-4 border rounded-lg bg-card min-h-0 overflow-hidden">
        <p className="text-sm text-muted-foreground">Chat com IA (painel de módulos / conteúdo)</p>
        {pageStructure != null && <p className="text-xs mt-2">{pageStructure?.length ?? 0} módulos</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 border rounded-lg bg-card min-h-0 overflow-hidden">
      {hasChat && (
        <div className="flex gap-1 shrink-0 mb-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
              activeTab === 'chat' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <MessageSquare className="w-4 h-4" />
            Chat com IA
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
              activeTab === 'html' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <Code className="w-4 h-4" />
            Editar HTML
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium',
              activeTab === 'sections' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
            )}
          >
            <LayoutList className="w-4 h-4" />
            Seções
          </button>
        </div>
      )}

      {activeTab === 'sections' ? (
        <div className="flex flex-col gap-2 flex-1 min-h-0 overflow-hidden">
          <Label className="text-sm font-medium shrink-0">Ordem das seções</Label>
          <p className="text-xs text-muted-foreground shrink-0">
            Arraste para reordenar os blocos da página. As alterações aparecem no preview.
          </p>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1 pr-1">
            {sections.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">Nenhuma seção encontrada. Use Editar HTML ou o Chat para adicionar conteúdo.</p>
            ) : (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleSectionsDragEnd}>
                <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                  {sections.map((section) => (
                    <SortableSectionItem key={section.id} section={section} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      ) : (!hasChat || activeTab === 'html') ? (
        <>
          <div className="flex items-center justify-between gap-2 shrink-0">
            <Label className="text-sm font-medium">Editar HTML da página</Label>
            {typeof onSaveProject === 'function' && (
              <Button size="sm" onClick={onSaveProject} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando…' : 'Salvar'}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 shrink-0">
            Altere o HTML abaixo e use o painel à direita para ver o preview. Salve para guardar no projeto.
          </p>
          <Textarea
            value={htmlContent || ''}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="flex-1 min-h-[200px] mt-2 font-mono text-xs resize-none bg-muted border-border text-foreground"
            placeholder="<section>...</section>"
          />
        </>
      ) : (
        <>
          {llmConnections.length > 1 && (
            <div className="shrink-0 mb-2">
              <Label className="text-xs text-muted-foreground">Modelo de linguagem</Label>
              <Select value={selectedLlmId || ''} onValueChange={(v) => setSelectedLlmId?.(v)}>
                <SelectTrigger className="mt-1 h-8 text-xs bg-muted border-border">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {llmConnections.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.provider})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {llmConnections.length === 0 && (
            <p className="text-xs text-amber-600 shrink-0 mb-2">
              <Link to="/settings/ai" className="underline">Configure uma conexão de IA em Minha IA</Link> para usar o chat.
            </p>
          )}
          <p className="text-xs text-muted-foreground shrink-0 mb-1">
            A geração pode levar até 5 minutos; o processo para ao concluir ou ao atingir o limite de tempo.
          </p>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-2">
              {(chatHistory || []).map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    'text-sm rounded-lg px-3 py-2 max-w-[95%]',
                    msg.role === 'user' ? 'bg-primary text-primary-foreground ml-auto' : 'bg-muted text-foreground'
                  )}
                >
                  {msg.content}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2 shrink-0">
              <Textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendChat())}
                placeholder="Descreva o que quer na página..."
                className="min-h-[60px] resize-none bg-muted border-border text-foreground text-sm"
                disabled={isSendingChat || llmConnections.length === 0}
              />
              <Button
                size="sm"
                onClick={handleSendChat}
                disabled={!chatInput?.trim() || isSendingChat || llmConnections.length === 0}
                className="shrink-0"
              >
                {isSendingChat ? '…' : 'Enviar'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatPanel;
