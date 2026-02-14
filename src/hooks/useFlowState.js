import { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge, useReactFlow } from 'reactflow';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

const initialNodes = [];
const initialEdges = [];

const getNodeDefaults = (type, position, data) => {
    const baseNode = {
        id: `${type}-${uuidv4()}`,
        type,
        position,
        data: { label: `${data.label}`, ...data },
    };
    return baseNode;
};

export const useFlowState = (flowData) => {
    const { clients, campaigns, modules, plannings, analyses, presets, knowledgeSources, fetchData: refreshFlowData } = flowData;
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [flows, setFlows] = useState([]);
    const [activeFlow, setActiveFlow] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
    const [newFlowName, setNewFlowName] = useState('');
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

    const { setViewport, getViewport } = useReactFlow();
    const { flowId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchFlows = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('creative_flows')
            .select('id, name')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });
        if (error) {
            toast({ title: 'Erro ao buscar fluxos', description: error.message, variant: 'destructive' });
        } else {
            setFlows(data);
        }
    }, [user, toast]);

    const loadFlow = useCallback(async (id) => {
        const { data, error } = await supabase
            .from('creative_flows')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            toast({ title: 'Erro ao carregar fluxo', description: error.message, variant: 'destructive' });
            navigate('/fluxo-criativo');
        } else {
            setActiveFlow(data);
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            if (data.viewport) {
                setViewport(data.viewport);
            }
        }
    }, [setNodes, setEdges, setViewport, toast, navigate]);

    useEffect(() => {
        fetchFlows();
    }, [fetchFlows]);

    useEffect(() => {
        if (flowId) {
            loadFlow(flowId);
        } else {
            setActiveFlow(null);
            setNodes([]);
            setEdges([]);
        }
    }, [flowId, loadFlow, setNodes, setEdges]);

    const getUpstreamNodesData = (nodeId, currentNodes, currentEdges) => {
        const context = {};
        const visited = new Set();
        const queue = [nodeId];
    
        while (queue.length > 0) {
            const currentId = queue.shift();
            if (visited.has(currentId)) continue;
            visited.add(currentId);
    
            const incomingEdges = currentEdges.filter(edge => edge.target === currentId);
            for (const edge of incomingEdges) {
                const sourceNode = currentNodes.find(n => n.id === edge.source);
                if (sourceNode) {
                    if (sourceNode.data.output) {
                        let key = sourceNode.type;
                        if (context[key]) {
                            let i = 2;
                            while (context[`${key}_${i}`]) {
                                i++;
                            }
                            key = `${key}_${i}`;
                        }
                        context[key] = sourceNode.data.output;
                    }
                    if (!visited.has(sourceNode.id)) {
                        queue.push(sourceNode.id);
                    }
                }
            }
        }
        return context;
    };

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({ ...params, animated: true }, eds));
    }, [setEdges]);

    const updateNodeData = useCallback((nodeId, newData) => {
        setNodes((nds) =>
            nds.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...newData } }
                    : node
            )
        );
    }, [setNodes]);

    const addNode = useCallback((type, label) => {
        const position = { x: Math.random() * 400, y: Math.random() * 400 };
        let nodeData = { label };

        switch (type) {
            case 'client':
                nodeData.clients = clients;
                break;
            case 'context':
                nodeData.clients = clients;
                break;
            case 'campaign':
                nodeData.campaigns = campaigns;
                break;
            case 'agent':
                nodeData.modules = modules;
                break;
            case 'planning':
                nodeData.plannings = plannings;
                break;
            case 'analysis':
                nodeData.analyses = analyses;
                break;
            case 'image_generator':
                nodeData.presets = presets;
                break;
            case 'knowledge':
                nodeData.knowledgeSources = knowledgeSources;
                break;
            default:
                break;
        }

        const newNode = getNodeDefaults(type, position, nodeData);
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes, clients, campaigns, modules, plannings, analyses, presets, knowledgeSources]);

    useEffect(() => {
        setNodes((nds) =>
            nds.map((node) => {
                const inputData = getUpstreamNodesData(node.id, nds, edges);
                let specificData = {};
                switch (node.type) {
                    case 'client':
                        specificData = { clients };
                        break;
                    case 'context':
                        specificData = { clients };
                        break;
                    case 'campaign':
                        specificData = { campaigns };
                        break;
                    case 'agent':
                        specificData = { modules };
                        break;
                    case 'planning':
                        specificData = { plannings };
                        break;
                    case 'analysis':
                        specificData = { analyses };
                        break;
                    case 'image_generator':
                        specificData = { presets };
                        break;
                    case 'knowledge':
                        specificData = { knowledgeSources };
                        break;
                    default:
                        break;
                }
                return { ...node, data: { ...node.data, ...specificData, inputData } };
            })
        );
    }, [clients, campaigns, modules, plannings, analyses, presets, knowledgeSources, edges, setNodes]);

    const handleSaveFlow = async (flowName) => {
        if (!user) return;
        if (activeFlow && !flowName) {
            setIsSaving(true);
            const { error } = await supabase
                .from('creative_flows')
                .update({
                    nodes,
                    edges,
                    viewport: getViewport(),
                })
                .eq('id', activeFlow.id);
            setIsSaving(false);
            if (error) {
                toast({ title: 'Erro ao salvar fluxo', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Fluxo salvo com sucesso!' });
                fetchFlows();
            }
        } else if (flowName) {
            setIsSaving(true);
            const { data, error } = await supabase
                .from('creative_flows')
                .insert({
                    user_id: user.id,
                    name: flowName,
                    nodes,
                    edges,
                    viewport: getViewport(),
                })
                .select()
                .single();
            setIsSaving(false);
            setIsNamePromptOpen(false);
            setNewFlowName('');
            if (error) {
                toast({ title: 'Erro ao criar fluxo', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Novo fluxo criado!' });
                fetchFlows();
                navigate(`/fluxo-criativo/${data.id}`);
            }
        } else {
            setIsNamePromptOpen(true);
        }
    };

    const handleNewFlow = () => {
        navigate('/fluxo-criativo');
        setActiveFlow(null);
        setNodes([]);
        setEdges([]);
    };


    const handleFlowSelect = (id) => {
        navigate(`/fluxo-criativo/${id}`);
    };

    const handleDeleteFlow = () => {
        if (activeFlow) {
            setIsDeleteConfirmOpen(true);
        }
    };

    const confirmDeleteFlow = async () => {
        if (!activeFlow) return;
        const { error } = await supabase
            .from('creative_flows')
            .delete()
            .eq('id', activeFlow.id);
        
        setIsDeleteConfirmOpen(false);
        if (error) {
            toast({ title: 'Erro ao excluir fluxo', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Fluxo excluído com sucesso!' });
            fetchFlows();
            handleNewFlow();
        }
    };

    return {
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
        refreshFlowData,
    };
};