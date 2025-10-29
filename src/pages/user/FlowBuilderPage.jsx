import React from 'react';
    import { ReactFlowProvider } from 'reactflow';
    import { Helmet } from 'react-helmet';
    import {
        AlertDialog,
        AlertDialogAction,
        AlertDialogCancel,
        AlertDialogContent,
        AlertDialogDescription,
        AlertDialogFooter,
        AlertDialogHeader,
        AlertDialogTitle,
    } from "@/components/ui/alert-dialog";
    import { Input } from "@/components/ui/input";
    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
    import { useFlowData } from '@/hooks/useFlowData';
    import { useFlowState } from '@/hooks/useFlowState';
    import NodeToolbar from '@/components/flow-builder/NodeToolbar';
    import FlowCanvas from '@/components/flow-builder/FlowCanvas';
    import FlowControls from '@/components/flow-builder/FlowControls';
    
    const FlowBuilderPageContent = () => {
        const flowData = useFlowData();
        const {
            nodes,
            edges,
            flows,
            activeFlow,
            isSaving,
            isNamePromptOpen,
            newFlowName,
            setNewFlowName,
            setIsNamePromptOpen,
            isDeleteConfirmOpen,
            setIsDeleteConfirmOpen,
            onNodesChange,
            onEdgesChange,
            onConnect,
            updateNodeData,
            addNode,
            handleSaveFlow,
            handleNewFlow,
            handleFlowSelect,
            handleDeleteFlow,
            confirmDeleteFlow,
        } = useFlowState(flowData);
    
        const flowControlsProps = {
            onSave: () => handleSaveFlow(),
            onNew: handleNewFlow,
            onDelete: handleDeleteFlow,
            flows,
            onFlowSelect: handleFlowSelect,
            activeFlow,
            isLoading: flowData.isLoading,
            isSaving,
        };
    
        return (
            <>
                <Helmet>
                    <title>Fluxo Criativo - Cérebro Ápice</title>
                    <meta name="description" content="Construa e visualize seus fluxos de criação de conteúdo de forma inteligente e conectada." />
                </Helmet>
                <div className="flex flex-col h-full w-full">
                    <header className="flex-shrink-0">
                        <FlowControls {...flowControlsProps} />
                    </header>
                    <div className="flex-grow">
                        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
                            <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
                                <NodeToolbar addNode={addNode} isLoadingData={flowData.isLoading} />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={80}>
                                <FlowCanvas
                                    nodes={nodes}
                                    edges={edges}
                                    onNodesChange={onNodesChange}
                                    onEdgesChange={onEdgesChange}
                                    onConnect={onConnect}
                                    updateNodeData={updateNodeData}
                                    onRefreshData={flowData.fetchData} // Pass the fetchData function to refresh data
                                />
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>
                <AlertDialog open={isNamePromptOpen} onOpenChange={setIsNamePromptOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Salvar Novo Fluxo</AlertDialogTitle>
                            <AlertDialogDescription>
                                Digite um nome para o seu novo fluxo criativo.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Input
                            value={newFlowName}
                            onChange={(e) => setNewFlowName(e.target.value)}
                            placeholder="Ex: Lançamento Produto X"
                        />
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleSaveFlow(newFlowName)} disabled={!newFlowName.trim()}>Salvar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
                <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                            <AlertDialogDescription>
                                Você tem certeza que deseja excluir o fluxo "{activeFlow?.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDeleteFlow} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    };
    
    const FlowBuilderPageWrapper = () => (
        <ReactFlowProvider>
            <FlowBuilderPageContent />
        </ReactFlowProvider>
    );
    
    export default FlowBuilderPageWrapper;