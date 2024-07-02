import { memo } from 'react';
import {
  BaseEdge,
  EdgeProps,
  Position,
  getBezierPath,
  getSmoothStepPath,
} from 'reactflow';

export const WorkflowEdgeDefault = memo(
  ({
    style,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    targetPosition = Position.Top,
    sourcePosition = Position.Bottom,
  }: EdgeProps) => {
    let edgePath = '';

    if (sourceX > targetX) {
      [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        borderRadius: 15,
      });
    } else {
      [edgePath] = getBezierPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
      });
    }

    return (
      <>
        <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      </>
    );
  },
);
WorkflowEdgeDefault.displayName = 'WorkflowEdgeDefault';
