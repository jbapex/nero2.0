import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, MiniMap } from 'reactflow';
import 'reactflow/dist/style.css';

import ClientNode from '@/components/flow-builder/nodes/ClientNode';
import CampaignNode from '@/components/flow-builder/nodes/CampaignNode';
import AgentNode from '@/components/flow-builder/nodes/AgentNode';
import ChatNode from '@/components/flow-builder/nodes/ChatNode';
import PlanningNode from '@/components/flow-builder/nodes/PlanningNode';
import AnalysisNode from '@/components/flow-builder/nodes/AnalysisNode';
import ImageGeneratorNode from '@/components/flow-builder/nodes/ImageGeneratorNode';
import VideoTranscriberNode from '@/components/flow-builder/nodes/VideoTranscriberNode';
import PageAnalyzerNode from '@/components/flow-builder/nodes/PageAnalyzerNode';
import SiteCreatorNode from '@/components/flow-builder/nodes/SiteCreatorNode';
import KnowledgeNode from '@/components/flow-builder/nodes/KnowledgeNode';
import CustomEdge from '@/components/flow-builder/edges/CustomEdge';

const FlowCanvas = ({
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    updateNodeData,
    onRefreshData, // Pass down the refresh function
}) => {
    const nodeTypes = useMemo(() => ({
        client: (props) => <ClientNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        campaign: (props) => <CampaignNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        agent: (props) => <AgentNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        chat: (props) => <ChatNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData, onRefreshData }} />,
        planning: (props) => <PlanningNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        analysis: (props) => <AnalysisNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        image_generator: (props) => <ImageGeneratorNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        video_transcriber: (props) => <VideoTranscriberNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        page_analyzer: (props) => <PageAnalyzerNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        site_creator: (props) => <SiteCreatorNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
        knowledge: (props) => <KnowledgeNode {...props} data={{ ...props.data, onUpdateNodeData: updateNodeData }} />,
    }), [updateNodeData, onRefreshData]);

    const edgeTypes = useMemo(() => ({
        custom: CustomEdge,
    }), []);

    const defaultEdgeOptions = {
        style: { strokeWidth: 2, stroke: '#8b5cf6' },
        animated: true,
        type: 'custom',
    };

    return (
        <div className="flex-grow h-full w-full relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                fitView
                className="bg-background"
                proOptions={{ hideAttribution: true }}
            >
                <Controls position="bottom-right" />
                <MiniMap position="bottom-right" nodeStrokeWidth={3} zoomable pannable className="!bg-background border-2 border-border" />
                <Background variant="dots" gap={16} size={1} />
            </ReactFlow>
        </div>
    );
};

export default FlowCanvas;