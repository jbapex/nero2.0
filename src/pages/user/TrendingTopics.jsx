import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion, AnimatePresence } from 'framer-motion';
    import { Flame, ExternalLink, Newspaper, RefreshCw, Sparkles, Wand2, BrainCircuit, BarChart, Hand as HeartHand, Leaf } from 'lucide-react';
    import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { supabase } from '@/lib/customSupabaseClient';
    import { toast as sonnerToast } from 'sonner';
    import { formatDistanceToNow } from 'date-fns';
    import { ptBR } from 'date-fns/locale';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter
    } from "@/components/ui/dialog";
    import { Checkbox } from '@/components/ui/checkbox';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { Badge } from '@/components/ui/badge';
    import ReactMarkdown from 'react-markdown';
    
    const exampleTrends = [
      {
        title: "IA Generativa Revoluciona Pequenos Negócios",
        link: "https://trends.google.com/trends/explore?q=IA%20Generativa",
        snippet: "Ferramentas de IA estão permitindo que PMEs criem conteúdo, automatizem tarefas e compitam com grandes empresas.",
        source: "Tech News Brasil",
        pubDate: new Date().toISOString(),
        category: "Tecnologia",
        volume: "1.2M",
        icon: <BrainCircuit className="w-4 h-4" />
      },
      {
        title: "Sustentabilidade como Diferencial Competitivo",
        link: "https://trends.google.com/trends/explore?q=Sustentabilidade%20ESG",
        snippet: "Consumidores preferem marcas com práticas ESG claras. Empresas que investem em sustentabilidade veem aumento de receita.",
        source: "Economia Verde",
        pubDate: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        category: "Negócios",
        volume: "850K",
        icon: <Leaf className="w-4 h-4" />
      },
      {
        title: "Saúde Mental no Ambiente de Trabalho é Prioridade",
        link: "https://trends.google.com/trends/explore?q=Sa%C3%BAde%20Mental%20no%20Trabalho",
        snippet: "Programas de bem-estar e apoio psicológico se tornam essenciais para retenção de talentos e produtividade.",
        source: "RH em Foco",
        pubDate: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
        category: "RH & Cultura",
        volume: "600K",
        icon: <HeartHand className="w-4 h-4" />
      },
      {
        title: "Análise de Dados Preditiva para Varejo",
        link: "https://trends.google.com/trends/explore?q=An%C3%A1lise%20Preditiva",
        snippet: "Varejistas usam IA para prever demanda, otimizar estoques e personalizar ofertas, aumentando a margem de lucro.",
        source: "Varejo Inteligente",
        pubDate: new Date(Date.now() - 3600 * 1000 * 6).toISOString(),
        category: "Dados",
        volume: "450K",
        icon: <BarChart className="w-4 h-4" />
      },
      {
        title: "Creator Economy: Novos Modelos de Monetização",
        link: "https://trends.google.com/trends/explore?q=Creator%20Economy",
        snippet: "Criadores de conteúdo exploram assinaturas, produtos digitais e parcerias diretas, diversificando além dos anúncios.",
        source: "Marketing Digital Hoje",
        pubDate: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
        category: "Marketing",
        volume: "950K",
        icon: <Sparkles className="w-4 h-4" />
      },
      {
        title: "Cibersegurança para Startups: Um Investimento Crucial",
        link: "https://trends.google.com/trends/explore?q=Ciberseguran%C3%A7a%20para%20Startups",
        snippet: "Com o aumento de ataques, startups que investem em segurança desde o início ganham a confiança de investidores e clientes.",
        source: "Segurança Digital",
        pubDate: new Date(Date.now() - 3600 * 1000 * 10).toISOString(),
        category: "Tecnologia",
        volume: "300K",
        icon: <BrainCircuit className="w-4 h-4" />
      }
    ];
    
    const categoryStyles = {
      "Tecnologia": "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
      "Negócios": "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
      "RH & Cultura": "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
      "Dados": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
      "Marketing": "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300",
      "Default": "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    };
    
    const LoadingSkeleton = () => (
        <Card className="h-full animate-pulse">
            <CardHeader>
                <div className="h-6 w-3/4 bg-muted rounded-md mb-2"></div>
                <div className="h-4 w-1/2 bg-muted rounded-md"></div>
            </CardHeader>
            <CardContent>
                <div className="h-10 w-full bg-muted rounded-md mb-4"></div>
                <div className="h-4 w-1/4 bg-muted rounded-md"></div>
            </CardContent>
        </Card>
    );
    
    const AnglesModal = ({ open, setOpen, angles, loading }) => {
        const renderContent = (title, items) => (
            <div className="mb-6">
                <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <Card key={index} className="bg-muted/50">
                            <CardContent className="p-3">
                                <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none">{item}</ReactMarkdown>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-2xl">
                            <Sparkles className="w-6 h-6 mr-2 text-primary" />
                            Ângulos e Ideias de Conteúdo
                        </DialogTitle>
                        <DialogDescription>
                            Use estas ideias como ponto de partida para criar seu próximo conteúdo viral.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-[60vh] pr-4">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="flex flex-col items-center gap-4">
                                    <Wand2 className="w-12 h-12 text-primary animate-pulse" />
                                    <p className="text-muted-foreground">Nossa IA está trabalhando...</p>
                                </div>
                            </div>
                        ) : angles ? (
                            <div>
                                {renderContent("💡 Ideias de Conteúdo", angles.ideias_de_conteudo)}
                                {renderContent("🎣 Ganchos Virais", angles.ganchos_virais)}
                                {renderContent("🎬 Títulos para Reels", angles.titulos_para_reels)}
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <p>Nenhuma ideia gerada ainda.</p>
                            </div>
                        )}
                    </ScrollArea>
                    <DialogFooter>
                        <Button onClick={() => setOpen(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };
    
    const TrendingTopics = () => {
        const [trends, setTrends] = useState([]);
        const [lastUpdated, setLastUpdated] = useState(null);
        const [isStale, setIsStale] = useState(false);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState(null);
        const [selectedTopics, setSelectedTopics] = useState([]);
        const [isGenerating, setIsGenerating] = useState(false);
        const [generatedAngles, setGeneratedAngles] = useState(null);
        const [isModalOpen, setIsModalOpen] = useState(false);
    
        const fetchTrends = useCallback(async (forceRefresh = false) => {
            setLoading(true);
            setError(null);
            if (forceRefresh) {
                sonnerToast.info('Forçando a atualização das tendências...');
            }
            try {
                const { data, error: functionError } = await supabase.functions.invoke('trends-br');
    
                if (functionError) {
                  const errorBody = functionError.context?.json ? await functionError.context.json() : { error: functionError.message };
                  throw new Error(errorBody.error);
                }
                
                setTrends(data.value.trends || []);
                setLastUpdated(data.updated_at);
                setIsStale(data.stale || false);
    
                if (data.stale) {
                    sonnerToast.warning("Não foi possível buscar novas tendências. Exibindo a última versão em cache.");
                }
    
            } catch (err) {
                console.error(err);
                const errorMessage = err.message || "Ocorreu um erro desconhecido";
                setError(`Falha ao buscar tendências. ${errorMessage}`);
                sonnerToast.error("Erro ao buscar tendências", { 
                    description: "Exibindo dados de exemplo como fallback para garantir a funcionalidade."
                });
                setTrends(exampleTrends);
                setLastUpdated(new Date().toISOString());
                setIsStale(true);
            } finally {
                setLoading(false);
            }
        }, []);
    
        useEffect(() => {
            fetchTrends();
        }, [fetchTrends]);
    
        const handleToggleTopic = (topicLink) => {
            setSelectedTopics(prev =>
                prev.includes(topicLink)
                    ? prev.filter(t => t !== topicLink)
                    : [...prev, topicLink]
            );
        };
    
        const handleGenerateAngles = async () => {
            if (selectedTopics.length === 0) {
                sonnerToast.warning('Selecione pelo menos um tópico para gerar ideias.');
                return;
            }
            setIsGenerating(true);
            setGeneratedAngles(null);
            setIsModalOpen(true);
            try {
                const items = trends.filter(t => selectedTopics.includes(t.link));
                const { data, error: functionError } = await supabase.functions.invoke('trends-angles', {
                    body: { items }
                });
    
                if (functionError) {
                  const errorBody = functionError.context?.json ? await functionError.context.json() : { error: functionError.message };
                  throw new Error(errorBody.error);
                }
    
                setGeneratedAngles(data.angles);
    
            } catch (err) {
                console.error(err);
                sonnerToast.error('Erro ao gerar ângulos', { description: err.message });
                setIsModalOpen(false);
            } finally {
                setIsGenerating(false);
            }
        };
    
    
        return (
            <>
                <Helmet>
                    <title>Assuntos em Alta 🔥 | Neuro Ápice</title>
                    <meta name="description" content="Descubra o que o Brasil está pesquisando agora e use os insights para criar conteúdo viral." />
                </Helmet>
                <AnglesModal open={isModalOpen} setOpen={setIsModalOpen} angles={generatedAngles} loading={isGenerating} />
                <div className="container mx-auto p-4 md:p-6 lg:p-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
                            Assuntos em Alta 🔥
                        </h1>
                        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
                            Descubra o que o Brasil está pesquisando agora e use os insights para criar conteúdo viral.
                        </p>
                    </motion.div>
                    
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                        <div className="text-sm text-muted-foreground">
                            {lastUpdated && (
                                <div className="flex items-center gap-2">
                                    {isStale && <Badge variant="destructive">Cache / Exemplo</Badge>}
                                    <span>Última atualização: {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: ptBR })}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => fetchTrends(true)} disabled={loading}>
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Atualizar
                            </Button>
                            <Button size="sm" onClick={handleGenerateAngles} disabled={isGenerating || selectedTopics.length === 0}>
                                <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-pulse' : ''}`} />
                                {isGenerating ? 'Gerando...' : `Gerar Ângulos com IA (${selectedTopics.length})`}
                            </Button>
                        </div>
                    </div>
    
                    {error && !loading && (
                        <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 p-4 rounded-lg mb-6">
                            <p className="font-semibold">Falha ao buscar tendências em tempo real.</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loading ? (
                            Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} />)
                        ) : (
                            <AnimatePresence>
                                {trends.map((trend, index) => (
                                    <motion.div
                                        key={trend.link}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3, delay: index * 0.03 }}
                                    >
                                        <Card className={`h-full flex flex-col transition-all duration-300 ${selectedTopics.includes(trend.link) ? 'border-primary shadow-lg' : 'hover:shadow-md'}`}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between gap-4">
                                                    <CardTitle className="text-base leading-tight">{trend.title}</CardTitle>
                                                    <Checkbox
                                                        id={`topic-${index}`}
                                                        checked={selectedTopics.includes(trend.link)}
                                                        onCheckedChange={() => handleToggleTopic(trend.link)}
                                                        className="mt-1"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs pt-2 flex-wrap">
                                                    <Badge variant="outline" className={categoryStyles[trend.category] || categoryStyles.Default}>
                                                        {trend.icon || <Flame className="w-3 h-3 mr-1" />}
                                                        {trend.category || 'Geral'}
                                                    </Badge>
                                                    {trend.volume && <Badge variant="secondary">{trend.volume} buscas</Badge>}
                                                </div>
                                            </CardHeader>
                                            <CardContent className="flex-grow flex flex-col">
                                                <p className="text-sm text-muted-foreground flex-grow mb-4">
                                                    {trend.snippet}
                                                </p>
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                        <Newspaper className="w-3 h-3" /> {trend.source}
                                                    </p>
                                                    <Button asChild variant="outline" size="sm" className="w-full mt-auto">
                                                        <a href={trend.link} target="_blank" rel="noopener noreferrer">
                                                            Ver notícia <ExternalLink className="w-3 h-3 ml-2" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        )}
                    </div>
    
                    {!loading && trends.length === 0 && (
                        <div className="text-center col-span-full py-16">
                            <Flame className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nenhuma tendência encontrada no momento.</p>
                            <Button variant="link" onClick={() => fetchTrends(true)}>Tentar atualizar</Button>
                        </div>
                    )}
                </div>
            </>
        );
    };
    
    export default TrendingTopics;