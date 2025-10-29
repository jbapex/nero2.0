import React, { useState, useEffect, useRef, useCallback } from 'react';
    import { useParams, Link } from 'react-router-dom';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Send, Sparkles, Bot, User, CornerDownLeft, Loader2, ChevronLeft, Square } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Textarea } from '@/components/ui/textarea';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import ReactMarkdown from 'react-markdown';
    
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
    
      return <ReactMarkdown>{displayedContent}</ReactMarkdown>;
    };
    
    const CampaignCopilot = () => {
      const { campaignId } = useParams();
      const { user } = useAuth();
      const { toast } = useToast();
    
      const [messages, setMessages] = useState([]);
      const [input, setInput] = useState('');
      const [isLoading, setIsLoading] = useState(false);
      const [isStreaming, setIsStreaming] = useState(false);
      const [campaign, setCampaign] = useState(null);
      const [isReady, setIsReady] = useState(false);
      const messagesEndRef = useRef(null);
      const abortControllerRef = useRef(null);
    
      const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      };
    
      useEffect(scrollToBottom, [messages, isLoading, isStreaming]);
    
      const initializeChat = useCallback(async () => {
        if (!user || !campaignId) return;
        setIsLoading(true);
    
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, name, clients(name)')
          .eq('id', campaignId)
          .eq('user_id', user.id)
          .single();
    
        if (campaignError || !campaignData) {
          toast({ title: 'Erro', description: 'Campanha não encontrada ou acesso negado.', variant: 'destructive' });
          setIsReady(false);
          setIsLoading(false);
          return;
        }
        setCampaign(campaignData);
    
        const { data: sessions, error: sessionError } = await supabase
          .from('campaign_chat_sessions')
          .select('messages')
          .eq('campaign_id', campaignId)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
    
        if (sessionError) {
          toast({ title: 'Erro ao carregar chat', description: sessionError.message, variant: 'destructive' });
          setIsReady(false);
          setIsLoading(false);
          return;
        }
    
        if (sessions && sessions.length > 0) {
          setMessages(sessions[0].messages);
        } else {
          const initialMessage = {
            role: 'assistant',
            content: `Olá! Sou seu copiloto para a campanha **${campaignData.name}**. Como posso te ajudar a decolar hoje? Você pode me pedir para criar textos, imagens, anúncios e muito mais!`
          };
          setMessages([initialMessage]);
          await supabase.from('campaign_chat_sessions').insert({
            user_id: user.id,
            campaign_id: campaignId,
            messages: [initialMessage]
          });
        }
        setIsReady(true);
        setIsLoading(false);
      }, [campaignId, user, toast]);
    
      useEffect(() => {
        initializeChat();
      }, [initializeChat]);
    
      const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading || isStreaming || !isReady) return;
    
        const userMessage = { role: 'user', content: input };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInput('');
        setIsLoading(true);
        setIsStreaming(false);
    
        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;
    
        try {
          const { data, error } = await supabase.functions.invoke('campaign-copilot', {
            body: {
              campaign_id: campaignId,
              messages: newMessages,
            },
            signal,
          });
    
          if (error) {
            if (error.name === 'AbortError') {
              toast({ title: 'Geração cancelada', description: 'Você interrompeu a resposta da IA.' });
              setIsLoading(false);
              return;
            }
            const errorBody = await error.context.json();
            throw new Error(errorBody.error || error.message);
          }
          
          const assistantResponse = data.response;
          setIsLoading(false);
          setIsStreaming(true);
          setMessages(prev => [...prev, assistantResponse]);
    
        } catch (err) {
          if (err.name === 'AbortError') {
            toast({ title: 'Geração cancelada', description: 'Você interrompeu a resposta da IA.' });
            setIsLoading(false);
            return;
          }
          const errorMessage = { role: 'assistant', content: `Desculpe, ocorreu um erro: ${err.message}` };
          setMessages(prev => [...prev, errorMessage]);
          toast({
            title: 'Erro na comunicação com o copiloto',
            description: err.message,
            variant: 'destructive',
          });
          setIsLoading(false);
          setIsStreaming(false);
        } finally {
          abortControllerRef.current = null;
        }
      };
    
      const handleStopGeneration = () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    
      if (!isReady && isLoading) {
        return (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-16 h-16 animate-spin text-primary" />
          </div>
        );
      }
    
      if (!isReady && !isLoading) {
        return (
          <div className="text-center p-8">
            <h2 className="text-2xl font-bold">Erro ao Carregar Copiloto</h2>
            <p className="text-muted-foreground">Não foi possível iniciar o copiloto para esta campanha.</p>
            <Button asChild className="mt-4"><Link to="/campanhas">Voltar para Campanhas</Link></Button>
          </div>
        );
      }
    
      return (
        <div className="flex flex-col h-full max-h-[calc(100vh-4rem)]">
          <header className="flex items-center p-4 border-b bg-background sticky top-0 z-10">
            <Button asChild variant="ghost" size="icon" className="mr-4">
              <Link to="/campanhas"><ChevronLeft className="w-5 h-5" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Copiloto: {campaign?.name}
              </h1>
              {campaign?.clients?.name && <p className="text-sm text-muted-foreground">Cliente: {campaign.clients.name}</p>}
            </div>
          </header>
    
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            <AnimatePresence>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-2xl p-4 rounded-2xl prose prose-sm dark:prose-invert prose-p:my-2 prose-headings:my-3 ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'}`}>
                    {msg.role === 'assistant' && index === messages.length - 1 && isStreaming ? (
                      <StreamingMessage content={msg.content} onFinished={() => setIsStreaming(false)} />
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </AnimatePresence>
          </div>
          <div className="p-4 md:p-6 border-t bg-background">
            {isLoading || isStreaming ? (
              <div className="flex items-center justify-between w-full rounded-md border border-input bg-background px-4 py-2 min-h-[52px]">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Gerando...</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleStopGeneration}>
                  <Square className="w-4 h-4 mr-2" />
                  Parar
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendMessage} className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Converse com seu copiloto de campanha..."
                  className="pr-24 min-h-[52px] resize-none"
                  disabled={isLoading || isStreaming}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground hidden md:inline">
                    <CornerDownLeft className="inline w-3 h-3" /> para enviar
                  </span>
                  <Button type="submit" size="icon" disabled={!input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      );
    };
    
    export default CampaignCopilot;