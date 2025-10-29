import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Download, Wand2, RefreshCw, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const artStyles = [
  { name: "Fotorrealista", icon: "📷" },
  { name: "Arte Digital", icon: "🎨" },
  { name: "Fantasia", icon: "🧙" },
  { name: "Cyberpunk", icon: "🤖" },
  { name: "Aquarela", icon: "💧" },
  { name: "Desenho a Lápis", icon: "✏️" },
];

const ImageGenerator = () => {
    const { toast } = useToast();
    const { session, loading: authLoading } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [selectedStyle, setSelectedStyle] = useState(artStyles[0].name);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState([]);
    const [lastPrompt, setLastPrompt] = useState('');
    const [errorState, setErrorState] = useState(null);

    const handleGenerate = async (currentPrompt) => {
        setErrorState(null);
        if (!currentPrompt) {
            toast({ title: "Prompt vazio", description: "Por favor, descreva a imagem que você deseja criar.", variant: "destructive" });
            return;
        }

        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !currentSession) {
            setErrorState({
                title: "Sessão Inválida",
                message: "Sua sessão de autenticação não foi encontrada ou expirou. Por favor, saia e faça login novamente para continuar."
            });
            toast({ title: "Sessão Inválida", description: "Faça login novamente.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setGeneratedImages([]);
        setLastPrompt(currentPrompt);

        const fullPrompt = `${currentPrompt}, no estilo ${selectedStyle}`;

        try {
            const { data, error: functionError } = await supabase.functions.invoke('nanobanana-image-generator', {
                body: { prompt: fullPrompt },
            });

            if (functionError) throw new Error(functionError.message);
            
            if (data.error) {
                // Tenta analisar o erro JSON se possível
                let parsedError;
                try {
                    parsedError = JSON.parse(data.error);
                } catch (e) {
                    // Se não for JSON, usa o erro como está
                    throw new Error(data.error);
                }

                if (parsedError.error === "Unauthorized") {
                     throw new Error("Erro de autorização. Sua sessão pode ter expirado. Tente recarregar a página ou fazer login novamente.");
                }

                throw new Error(parsedError.error || "Ocorreu um erro desconhecido na função de IA.");
            }

            if (!data.images || data.images.length === 0) throw new Error("Nenhuma imagem foi retornada pela IA. Tente novamente ou ajuste seu prompt.");

            setGeneratedImages(data.images);
            toast({ title: 'Imagens geradas com sucesso!', description: 'Sua criatividade ganhou vida.' });

        } catch (error) {
            console.error("Error invoking function:", error);
            setErrorState({
                title: "Falha na Geração",
                message: `Ocorreu um erro: ${error.message}`
            });
            toast({ title: "Erro ao gerar imagens", description: error.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (url) => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.download = `neuroapice-imagem-${new Date().getTime()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleRegenerate = () => {
        if (lastPrompt) {
            handleGenerate(lastPrompt);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-[500px] glass-effect border border-white/10 rounded-lg">
                    <Loader2 className="w-16 h-16 mb-4 animate-spin text-purple-400" />
                    <p className="text-xl font-semibold">Criando sua obra de arte...</p>
                    <p className="text-gray-400">Um momento, a IA está no processo criativo.</p>
                </motion.div>
            );
        }
        if (errorState) {
            return (
                <motion.div key="error" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center h-full min-h-[500px] text-center text-red-400 glass-effect border-2 border-dashed border-red-500/50 rounded-lg p-6">
                    <AlertTriangle className="w-16 h-16 mb-4 text-red-500" />
                    <h2 className="text-2xl font-bold text-white mb-2">{errorState.title}</h2>
                    <p className="text-red-300">{errorState.message}</p>
                    <Button onClick={() => handleGenerate(prompt)} className="mt-6">Tentar Novamente</Button>
                </motion.div>
            );
        }
        if (generatedImages.length > 0) {
            return (
                 <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                    <div className="grid grid-cols-1 gap-6">
                        {generatedImages.map((image, index) => (
                            <Card key={index} className="relative group overflow-hidden glass-effect border border-white/10">
                                <img src={image.url_publica} alt={`Imagem gerada: ${lastPrompt}`} className="w-full h-auto object-contain rounded-lg transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <Button size="icon" className="glass-button" onClick={() => handleDownload(image.url_publica)}><Download className="w-5 h-5" /></Button>
                                    <Button size="icon" className="glass-button" onClick={handleRegenerate}><RefreshCw className="w-5 h-5" /></Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </motion.div>
            );
        }
        return (
            <motion.div key="placeholder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-full min-h-[500px] text-center text-gray-400 glass-effect border-2 border-dashed border-white/10 rounded-lg">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-purple-400" />
                </div>
                <p className="text-xl font-semibold text-white">Suas imagens aparecerão aqui</p>
                <p>Descreva sua ideia, escolha um estilo e clique em "Gerar".</p>
            </motion.div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Gerador de Imagens com IA - Neuro Ápice</title>
                <meta name="description" content="Crie imagens únicas e de alta qualidade para suas campanhas com o poder da IA do Google." />
            </Helmet>
            <div className="flex flex-col h-full min-h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white p-4 sm:p-6 lg:p-8">
                <motion.header
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
                        Gerador de Imagens com IA
                    </h1>
                    <p className="text-lg text-gray-300 mt-2">Transforme suas ideias em visuais impressionantes.</p>
                </motion.header>

                <div className="flex-1 grid md:grid-cols-12 gap-8 items-start">
                    <Card className="md:col-span-4 glass-effect border border-white/10 shadow-lg shadow-purple-500/10">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Wand2 className="text-purple-400" /> Crie sua Imagem</CardTitle>
                            <CardDescription className="text-gray-400">Descreva o que você imagina e escolha um estilo.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="prompt" className="font-semibold text-gray-300">Sua Ideia</Label>
                                <Textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: Um astronauta surfando em uma onda cósmica com nebulosas ao fundo"
                                    className="mt-2 glass-input h-32"
                                />
                            </div>
                            <div>
                                <Label className="font-semibold text-gray-300">Estilo Artístico</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                    {artStyles.map((style) => (
                                        <Button
                                            key={style.name}
                                            variant={selectedStyle === style.name ? 'default' : 'outline'}
                                            onClick={() => setSelectedStyle(style.name)}
                                            className={`w-full h-12 text-xs transition-all duration-300 ${selectedStyle === style.name ? 'bg-purple-600 border-purple-500 glow-effect-sm' : 'border-white/20 bg-white/5 hover:bg-white/10'}`}
                                        >
                                            {style.icon} {style.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={() => handleGenerate(prompt)} disabled={isLoading || authLoading} className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg glow-effect transition-transform hover:scale-105">
                                {isLoading ? <Loader2 className="w-6 h-6 mr-2 animate-spin" /> : <Sparkles className="w-6 h-6 mr-2" />}
                                {isLoading ? 'Gerando Magia...' : 'Gerar Imagem'}
                            </Button>
                        </CardFooter>
                    </Card>

                    <div className="md:col-span-8">
                        <AnimatePresence mode="wait">
                            {renderContent()}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ImageGenerator;