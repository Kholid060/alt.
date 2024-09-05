/* eslint-disable @typescript-eslint/no-explicit-any */
import { WorkflowEdges, WorkflowNodes } from '@altdot/workflow';
import type { Edge, Node } from '@xyflow/react';
import {
  PossibleTypes,
  PossibleTypesTypeMap,
} from '../../interfaces/workflow-runner-worker.interface';
import { NodeInvalidTypeError } from './custom-errors';

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

export function getExactType(data: unknown) {
  return Object.prototype.toString.call(data).slice(8, -1) as PossibleTypes;
}

export function isValidType<T extends PossibleTypes[]>(
  value: unknown,
  expectedType: T,
  throwError?: { throw?: boolean; errorName?: string },
): value is PossibleTypesTypeMap[T[number]] {
  const valType = getExactType(value);
  const isValid = !expectedType.some((type) => valType !== type);

  if (!isValid && throwError?.throw) {
    throw new NodeInvalidTypeError(valType, expectedType, throwError.errorName);
  }

  return isValid;
}

export function promiseWithSignal<T = void>(
  callback: (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: any) => void,
  ) => void,
  signal: AbortSignal,
) {
  return new Promise<T>((resolve, reject) => {
    signal.addEventListener(
      'abort',
      () => {
        reject(new Error('ABORTED'));
      },
      { once: true },
    );

    callback(resolve, reject);
  });
}

export function validateTypes<T extends Record<string, any>>(
  data: T,
  paths: {
    key: keyof T;
    name: string;
    optional?: boolean;
    types: PossibleTypes[];
  }[],
) {
  paths.forEach((path) => {
    if (!Object.hasOwn(data, path.key)) {
      if (!path.optional)
        throw new Error(
          `The data doesn't have "${path.key.toString()}" property`,
        );
    }

    isValidType(data[path.key], path.types, {
      throw: true,
      errorName: `"${path.name}"`,
    });
  });
}
