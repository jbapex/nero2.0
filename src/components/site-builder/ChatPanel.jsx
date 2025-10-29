import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, CornerDownLeft, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useParams, useLocation } from 'react-router-dom';

const StreamingMessage = ({ content, onFinished }) => {
  const [displayedContent, setDisplayedContent] = useState('');

  useEffect(() => {
    setDisplayedContent('');
    if (content) {
      let i = 0;
      const interval = setInterval(() => {
        if (i < content.length) {
          setDisplayedContent(prev => prev + content[i]);
          i++;
        } else {
          clearInterval(interval);
          if (onFinished) onFinished();
        }
      }, 20);
      return () => clearInterval(interval);
    }
  }, [content, onFinished]);

  return <p className="text-sm whitespace-pre-wrap">{displayedContent}</p>;
};

const ChatPanel = ({ htmlContent, setHtmlContent, setIsBuilding, flowContext }) => {
  const { projectId } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollAreaRef = useRef(null);

  const getFlowContextFromState = () => {
    const flowNode = location.state?.flowNode;
    if (!flowNode) return null;

    return {
      nodeId: flowNode.id,
      nodeType: flowNode.type,
      nodeData: flowNode.data,
    };
  };

  const loadChatHistory = useCallback(async () => {
    if (!projectId || !user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_projects')
        .select('chat_history')
        .eq('id', projectId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data && data.chat_history) {
        setMessages(data.chat_history);
      } else {
        setMessages([{ role: 'assistant', content: "Olá! Como posso te ajudar a construir sua página hoje?" }]);
      }
    } catch (error) {
      toast.error('Erro ao carregar histórico do chat.', { description: error.message });
      setMessages([{ role: 'assistant', content: "Olá! Como posso te ajudar a construir sua página hoje?" }]);
    } finally {
      setIsLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, isLoading, isStreaming]);

  const saveChatHistory = async (newMessages) => {
    if (!projectId || !user) return;
    try {
      const { error } = await supabase
        .from('site_projects')
        .update({ chat_history: newMessages })
        .eq('id', projectId);

      if (error) throw error;
    } catch (error) {
      toast.error('Erro ao salvar histórico do chat.', { description: error.message });
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setIsStreaming(false);
    if(setIsBuilding) setIsBuilding(true);
    
    const finalFlowContext = flowContext || getFlowContextFromState();

    try {
      const { data, error } = await supabase.functions.invoke('site-builder-assistant', {
        body: { 
            messages: newMessages, 
            html_content: htmlContent,
            flow_context: finalFlowContext,
        },
      });

      if (error) {
        try {
            const errorContext = await error.context.json();
            throw new Error(errorContext.error || 'Erro desconhecido na função.');
        } catch (parseError) {
             throw new Error(error.message || 'Erro desconhecido na comunicação com a IA.');
        }
      }
      
      const assistantResponse = data.response;
      let finalMessages = newMessages;
      
      setIsLoading(false);

      if (assistantResponse.type === 'html_update' && assistantResponse.html) {
          setHtmlContent(assistantResponse.html);
          const explanation = assistantResponse.explanation || "Seu site foi atualizado.";
          finalMessages = [...newMessages, { role: 'assistant', content: explanation }];
          setMessages(prev => [...prev, { role: 'assistant', content: explanation }]);
          setIsStreaming(true);
      } else if (assistantResponse.type === 'message' && assistantResponse.content) {
          finalMessages = [...newMessages, { role: 'assistant', content: assistantResponse.content }];
          setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse.content }]);
          setIsStreaming(true);
      } else {
        const fallbackMessage = "Recebi uma resposta, mas não consegui processá-la. Verifique o preview para ver se houve alguma alteração.";
        finalMessages = [...newMessages, { role: 'assistant', content: fallbackMessage }];
        setMessages(prev => [...prev, { role: 'assistant', content: fallbackMessage }]);
        setIsStreaming(true);
      }

      await saveChatHistory(finalMessages);

    } catch (error) {
      console.error(error);
      const errorMsg = "Ocorreu um erro ao processar sua solicitação. Tente novamente.";
      const updatedMessages = [...newMessages, { role: 'assistant', content: errorMsg, isError: true }];
      setMessages(updatedMessages);
      toast.error("Erro na comunicação com a IA", { description: error.message });
      setIsLoading(false);
      if(setIsBuilding) setIsBuilding(false);
    }
  };
  
  const handleStreamingFinished = () => {
    setIsStreaming(false);
    if(setIsBuilding) setIsBuilding(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 backdrop-blur-sm border-l border-gray-700/50">
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
        <h2 className="text-xl font-bold text-white flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-primary animate-pulse" />
            Assistente IA
        </h2>
      </div>
      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div className="space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : message.isError 
                    ? 'bg-red-500/20 text-red-300 border border-red-500/50 rounded-bl-none'
                    : 'bg-gray-800 text-gray-300 rounded-bl-none'
                }`}>
                  {message.role === 'assistant' && !message.isError && index === messages.length - 1 && isStreaming ? (
                    <StreamingMessage content={message.content} onFinished={handleStreamingFinished} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="max-w-[80%] p-3 rounded-lg bg-gray-800 text-gray-300 rounded-bl-none">
                <p className="text-sm">Analisando e construindo...</p>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t border-gray-700/50">
        <form onSubmit={handleSubmit} className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Descreva o que você quer criar ou alterar..."
            className="w-full bg-gray-800 border-gray-600 text-white rounded-lg resize-none pr-20"
            rows={2}
            disabled={isLoading || isStreaming}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-3 bottom-3 bg-primary hover:bg-primary/90"
            disabled={isLoading || isStreaming || !input.trim()}
          >
            <CornerDownLeft className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;