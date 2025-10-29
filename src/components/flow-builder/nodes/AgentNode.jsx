import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Play, Loader2, Eye, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import ContentViewModal from '@/components/flow-builder/modals/ContentViewModal';
import RefineWithAiModal from '@/components/flow-builder/modals/RefineWithAiModal';

const AgentNode = ({ id, data, isConnectable, selected }) => {
    const { onUpdateNodeData, modules, inputData, selectedModuleId, optionalText } = data;
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

    const handleModuleChange = (moduleId) => {
        const selectedModule = modules.find(m => m.id.toString() === moduleId);
        onUpdateNodeData(id, { 
            selectedModuleId: moduleId, 
            label: selectedModule ? `Agente: ${selectedModule.name}` : 'Agente de IA'
        });
    };

    const handleOptionalTextChange = (e) => {
        onUpdateNodeData(id, { optionalText: e.target.value });
    };

    const handleGenerateContent = async (refinePrompt = null) => {
        if (!selectedModuleId) {
            toast({
                title: 'Nenhum módulo selecionado',
                description: 'Por favor, selecione um agente de IA para gerar o conteúdo.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);
        if (!refinePrompt) {
            onUpdateNodeData(id, { generatedText: null });
        }

        try {
            // Combine o texto opcional com as entradas existentes.
            // O user_text da função pode ser usado para refinar, ou para passar o texto opcional, ou a transcrição.
            let userTextForFunction = data.optionalText || '';
            if (inputData?.video_transcriber?.data?.transcript_text) {
                userTextForFunction += `\n\nContexto da Transcrição:\n${inputData.video_transcriber.data.transcript_text}`;
            }

            const payload = {
                module_id: selectedModuleId,
                campaign_id: inputData?.campaign?.id,
                client_id: inputData?.client?.id,
                knowledge_source_id: inputData?.knowledge?.id,
                user_text: refinePrompt ? `Refine o seguinte texto:\n\n${data.generatedText}\n\nInstrução: ${refinePrompt}` : userTextForFunction,
            };

            const { data: functionData, error } = await supabase.functions.invoke('generate-content', {
                body: JSON.stringify(payload),
            });

            if (error) throw new Error(error.message);

            onUpdateNodeData(id, { 
                generatedText: functionData.generatedText,
                output: { 
                    id: functionData.outputId,
                    data: functionData.generatedText,
                    moduleName: functionData.moduleName,
                }
            });

            toast({
                title: refinePrompt ? 'Conteúdo Refinado!' : 'Conteúdo Gerado!',
                description: `O agente "${functionData.moduleName}" concluiu a tarefa.`,
            });
        } catch (err) {
            toast({
                title: 'Erro ao processar conteúdo',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
            setIsRefineModalOpen(false);
        }
    };

    const isGenerationDisabled = !selectedModuleId || isLoading;
    const hasContent = data.generatedText && !isLoading;

    return (
        <>
            <div className="react-flow__node-default h-full w-full rounded-lg border-2 border-teal-500/50 shadow-lg bg-card text-card-foreground flex flex-col">
                <NodeResizer 
                    minWidth={320} 
                    minHeight={400}
                    maxWidth={800}
                    maxHeight={700}
                    isVisible={selected} 
                    lineClassName="border-teal-500"
                    handleClassName="bg-teal-500"
                />
                <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-3 h-3 !bg-teal-500" />
                <CardHeader className="flex-row items-center justify-between space-x-2 p-3 bg-teal-500/10">
                    <div className="flex items-center space-x-2">
                        <Bot className="w-5 h-5 text-teal-500" />
                        <CardTitle className="text-base">{data.label || 'Agente de IA'}</CardTitle>
                    </div>
                    <Button onClick={() => handleGenerateContent()} disabled={isGenerationDisabled} size="sm">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                        <span className="ml-2">Gerar</span>
                    </Button>
                </CardHeader>
                <CardContent className="p-3 flex-grow flex flex-col min-h-0 space-y-2">
                    <Select onValueChange={handleModuleChange} value={selectedModuleId} disabled={isLoading}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um agente..." />
                        </SelectTrigger>
                        <SelectContent>
                            {(modules || []).map((module) => (
                                <SelectItem key={module.id} value={module.id.toString()}>
                                    {module.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Textarea
                        placeholder="Instruções opcionais para a IA..."
                        value={optionalText || ''}
                        onChange={handleOptionalTextChange}
                        className="nodrag h-24 text-sm"
                        disabled={isLoading}
                    />
                    <div className="flex-grow border rounded-md min-h-0 relative">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                            </div>
                        ) : (
                            <ScrollArea className="h-full w-full nodrag">
                                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap p-2 text-left">
                                    {data.generatedText || "O conteúdo gerado aparecerá aqui."}
                                </div>
                            </ScrollArea>
                        )}
                         {hasContent && (
                            <div className="absolute top-2 right-2 flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background/50 backdrop-blur-sm" onClick={() => setIsRefineModalOpen(true)}>
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-background/50 backdrop-blur-sm" onClick={() => setIsViewModalOpen(true)}>
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
                <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-3 h-3 !bg-teal-500" />
            </div>
            {hasContent && (
                <>
                    <ContentViewModal
                        isOpen={isViewModalOpen}
                        onClose={() => setIsViewModalOpen(false)}
                        title="Visualizar Conteúdo Gerado"
                        content={data.generatedText}
                        onRefineClick={() => setIsRefineModalOpen(true)}
                    />
                    <RefineWithAiModal
                        isOpen={isRefineModalOpen}
                        onClose={() => setIsRefineModalOpen(false)}
                        onRefine={handleGenerateContent}
                        isLoading={isLoading}
                    />
                </>
            )}
        </>
    );
};

export default AgentNode;