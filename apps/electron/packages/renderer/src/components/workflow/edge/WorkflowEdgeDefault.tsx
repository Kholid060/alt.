import { memo } from 'react';
import { BaseEdge, EdgeProps, Position, getBezierPath } from 'reactflow';

function WorkflowEdgeDefault({
  style,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom,
}: EdgeProps) {
  // if target === "loop" then use getSmoothStepPath
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
    </>
  );
}

export default memo(WorkflowEdgeDefault);
