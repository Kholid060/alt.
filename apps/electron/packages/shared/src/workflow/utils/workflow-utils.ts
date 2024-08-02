import { WorkflowEdges, WorkflowNodes } from '@altdot/workflow';
import type { Edge, Node } from '@xyflow/react';

export function extractWorkflowNodeHandleType(handle: string) {
  const handles = handle.split(':');
  if (handles.length <= 1) return 'default';

  return handles[0];
}

export interface WorkflowNodeConnectionMapItem {
  nodeId: string;
  targetHandle?: string | null;
  sourceHandle?: string | null;
}

export interface WorkflowNodeConnectionMap {
  source: Record<string, WorkflowNodeConnectionMapItem[]>;
  target: Record<string, WorkflowNodeConnectionMapItem[]>;
}

export function getWorkflowNodeConnectionsMap(
  nodes: (WorkflowNodes | Node)[],
  edges: (WorkflowEdges | Edge)[],
) {
  const connectionMap: Record<string, WorkflowNodeConnectionMap> = {};
  const nodePositions = new Map(nodes.map((node) => [node.id, node.position]));

  edges.forEach(({ source, target, sourceHandle, targetHandle }) => {
    if (!nodePositions.has(source) || !nodePositions.has(target)) return;

    if (!connectionMap[source]) {
      connectionMap[source] = {
        source: { default: [] },
        target: { default: [] },
      };
    }
    if (!connectionMap[target]) {
      connectionMap[target] = {
        source: { default: [] },
        target: { default: [] },
      };
    }

    connectionMap[target].source.default.push({
      sourceHandle,
      targetHandle,
      nodeId: source,
    });

    const sourceHandleType = extractWorkflowNodeHandleType(sourceHandle ?? '');
    if (!connectionMap[source].target[sourceHandleType]) {
      connectionMap[source].target[sourceHandleType] = [];
    }
    connectionMap[source].target[sourceHandleType].push({
      targetHandle,
      sourceHandle,
      nodeId: target,
    });
  });

  // sort connection by the node Y position
  const connectionSorter = (
    a: WorkflowNodeConnectionMapItem,
    z: WorkflowNodeConnectionMapItem,
  ) => nodePositions.get(a.nodeId)!.y - nodePositions.get(z.nodeId)!.y;
  for (const key in connectionMap) {
    const connection = connectionMap[key];

    for (const handle in connection.source) {
      connection.source[handle].sort(connectionSorter);
    }
    for (const handle in connection.target) {
      connection.target[handle].sort(connectionSorter);
    }
  }

  return connectionMap;
}
