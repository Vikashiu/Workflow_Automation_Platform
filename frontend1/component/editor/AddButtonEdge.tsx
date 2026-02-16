
import React from 'react';
import {
  BaseEdge,
  getSmoothStepPath,
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
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge
      path={edgePath}
      markerEnd={markerEnd}
      style={{ 
        ...style, 
        strokeWidth: 2.5, 
        stroke: '#a78bfa',
        opacity: 0.85,
        filter: 'drop-shadow(0 0 3px rgba(167, 139, 250, 0.4))'
      }}
    />
  );
}
