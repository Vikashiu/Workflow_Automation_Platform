
import { Handle, Position, NodeProps, useReactFlow, getOutgoers, useNodes, useEdges } from '@xyflow/react';

const ZapNode = ({ id, data, selected }: NodeProps) => {
    const { setNodes, setEdges, getNode } = useReactFlow();
    const nodes = useNodes();
    const edges = useEdges();

    // Check if this node is a leaf node (has no outgoing connections)
    // We use the node from the store to ensure we have the full object for getOutgoers
    const currentNode = nodes.find(n => n.id === id);
    const isLastNode = currentNode ? getOutgoers(currentNode, nodes, edges).length === 0 : false;

    const iconSrc = typeof data.icon === 'string' ? data.icon : '';
    const label = typeof data.label === 'string' ? String(data.label) : '';
    const subtitle = typeof data.subtitle === 'string' ? String(data.subtitle) : '';
    const isTrigger = Boolean(data.isTrigger);

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes((nodes) => nodes.filter((n) => n.id !== id));
        setEdges((edges) => edges.filter((e) => e.source !== id && e.target !== id));
    };

    const handleAddNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newNodeId = (Math.floor(Math.random() * 1000000)).toString();
        const nextStepIndex = nodes.length + 1;

        if (!currentNode) return;

        const newNode = {
            id: newNodeId,
            type: 'zapNode',
            position: { x: currentNode.position.x, y: currentNode.position.y + 150 },
            data: { label: "Action", subtitle: `${nextStepIndex}. Action` },
        };

        const newEdge = {
            id: `e${id}-${newNodeId}`,
            source: id,
            target: newNodeId,
            type: 'addButton',
        };

        setNodes((nds) => [...nds, newNode]);
        setEdges((eds) => [...eds, newEdge]);
    };

    return (
        <div className="relative flex flex-col items-center">
            <div className={`w-40 shadow-lg rounded-xl bg-gradient-to-br border transition-all duration-300 group relative overflow-hidden ${selected 
                ? 'from-orange-400 to-orange-500 border-orange-300 shadow-orange-400/40 ring-2 ring-orange-300' 
                : isTrigger 
                  ? 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300 hover:shadow-blue-300/30' 
                  : 'from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300 hover:shadow-purple-300/30 hover:scale-105'} transform transition-transform`}>

                {/* Gradient Overlay for Visual Depth */}
                <div className="absolute inset-0 bg-white/40 pointer-events-none" />

                {/* Delete Button (X) */}
                <button
                    onClick={handleDelete}
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center border-2 border-red-300 shadow-lg transition-all z-20 hover:scale-110 active:scale-95"
                    title="Delete Step"
                >
                    <span className="text-sm font-bold leading-none">×</span>
                </button>

                {/* Input Handle */}
                {!isTrigger && (
                    <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3 !border-3 !border-white transition-all opacity-0 group-hover:opacity-100 !shadow-md" />
                )}

                <div className="flex items-center p-3 gap-3 relative z-10">
                    {/* App Icon Container */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/80 border border-white/50 flex items-center justify-center p-1.5 shadow-sm hover:bg-white transition-all">
                        {iconSrc ? (
                            <img src={iconSrc} alt="" className="w-full h-full object-contain" />
                        ) : (
                            <div className={`w-3.5 h-3.5 rounded-md ${isTrigger ? 'bg-blue-500' : 'bg-purple-500'}`} />
                        )}
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                        <p className={`text-[8px] font-extrabold uppercase tracking-wider leading-none mb-1 ${selected ? 'text-white' : isTrigger ? 'text-blue-600' : 'text-purple-600'}`}>
                            {subtitle || (isTrigger ? 'Trigger' : 'Action')}
                        </p>
                        <h3 className={`text-sm font-bold truncate leading-tight ${selected ? 'text-white' : 'text-gray-800'}`}>
                            {label}
                        </h3>
                    </div>
                </div>

                {/* Output Handle */}
                <Handle
                    type="source"
                    position={Position.Bottom}
                    isConnectable={isLastNode}
                    className={`!w-3 !h-3 !border-3 !border-white transition-all group-hover:opacity-100 ${isLastNode ? '!bg-purple-500 opacity-0 !shadow-md' : '!bg-transparent opacity-0'}`}
                />
            </div>

            {/* "Add Next" indicator for Last Node */}
            {isLastNode && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto cursor-pointer">
                    {/* Animated Connecting Line */}
                    <div className="w-0.5 h-8 bg-gradient-to-b from-purple-400 to-purple-200 animate-pulse"></div>
                    {/* Plus Button */}
                    <button
                        onClick={handleAddNext}
                        className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white border-2 border-purple-300 rounded-full flex items-center justify-center shadow-lg transition-all transform hover:scale-125 active:scale-95 z-20 font-bold text-xl hover:shadow-purple-500/50"
                        title="Add Next Step"
                    >
                        <span className="leading-none">+</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default ZapNode;
