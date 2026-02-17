import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
} from '@xyflow/react';

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { setNodes,setEdges } = useReactFlow();
  const onEdgeClick = () => {
    // setEdges((edges) => edges.filter((edge) => edge.id !== id));
    function handleInsertNodeBetween({
  id,
  source,
  target,
  type,
}: {
  id: string;
  source: string;
  target: string;
  type: string;
}) {
  const newId = target; // insert in place of target
  const newTarget = (parseInt(target) + 1).toString();

  // Shift nodes and insert new node
  setNodes((prevNodes) => {
    const shifted = prevNodes.map((node) => {
      const num = parseInt(node.id);
      const targetNum = parseInt(target);
      if (num >= targetNum) {
        return { ...node, id: (num + 1).toString() };
      }
      return node;
    });

    const newNode = {
      id: newId,
      data: { label: `Node ${newId}` },
      position: { x: 250 + Math.random() * 50, y: 150 + Math.random() * 50 },
      type: 'default',
    };

    return [...shifted, newNode];
  });

  // Shift edges and add 2 new ones
  setEdges((prevEdges) => {
    const updatedEdges: any[] = [];

    for (const edge of prevEdges) {
      if (edge.id === id) continue; // remove original edge

      let updatedEdge = { ...edge };
      const shiftFrom = parseInt(target);

      const edgeSourceNum = parseInt(edge.source);
      const edgeTargetNum = parseInt(edge.target);

      if (edgeSourceNum >= shiftFrom) updatedEdge.source = (edgeSourceNum + 1).toString();
      if (edgeTargetNum >= shiftFrom) updatedEdge.target = (edgeTargetNum + 1).toString();

      updatedEdges.push(updatedEdge);
    }

    // Add new edges: source -> newNode, newNode -> target
    updatedEdges.push(
      {
        id: `${source}-${newId}`,
        source,
        target: newId,
        type,
        data: { onAdd: handleInsertNodeBetween },
      },
      {
        id: `${newId}-${newTarget}`,
        source: newId,
        target: newTarget,
        type,
        data: { onAdd: handleInsertNodeBetween },
      }
    );

    return updatedEdges;
  });
}

  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="button-edge__label nodrag nopan"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <button className="button-edge__button" onClick={onEdgeClick}>
            +
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}


