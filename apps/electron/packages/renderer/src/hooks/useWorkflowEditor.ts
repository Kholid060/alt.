import { useContext } from 'react';
import { WorkflowEditorContext } from '../context/workflow-editor.context';
import {
  WorkflowClipboardData,
  WorkflowNewNode,
  WorkflowRunPayload,
} from '#packages/common/interface/workflow.interface';
import {
  WORKFLOW_ELEMENT_FORMAT,
  WORKFLOW_MANUAL_TRIGGER_ID,
} from '#packages/common/utils/constant/workflow.const';
import { parseJSON } from '@altdot/shared';
import { nanoid } from 'nanoid';
import { Connection, useReactFlow, useStore, useStoreApi } from '@xyflow/react';
import { isIPCEventError } from '../utils/helper';
import preloadAPI from '../utils/preloadAPI';
import { useWorkflowEditorStore } from '../stores/workflow-editor/workflow-editor.store';
import { useShallow } from 'zustand/react/shallow';
import { useToast } from '@altdot/ui';
import {
  WORKFLOW_NODE_TYPE,
  WorkflowEdges,
  WorkflowNodes,
} from '@altdot/workflow';

export function useWorkflowEditor() {
  const storeApi = useStoreApi();
  const context = useContext(WorkflowEditorContext);

  const { addEdges, addNodes } = useWorkflowEditorStore(
    useShallow((state) => ({
      addNodes: state.addNodes,
      addEdges: state.addEdges,
    })),
  );
  const unselectAll = useStore((state) => state.unselectNodesAndEdges);

  const { toast } = useToast();
  const { deleteElements } = useReactFlow();

  function selectAllNodes() {
    const nodes = storeApi.getState().nodes;
    storeApi.getState().addSelectedNodes(nodes.map((node) => node.id));
  }
  async function pasteElements() {
    const copiedElements = await preloadAPI.main.ipc.invoke(
      'clipboard:read-buffer',
      WORKFLOW_ELEMENT_FORMAT,
    );
    if (isIPCEventError(copiedElements)) return null;

    const elements: WorkflowClipboardData | null = parseJSON(
      copiedElements,
      null,
    );
    if (
      !elements ||
      !Array.isArray(elements.nodes) ||
      !Array.isArray(elements.edges)
    )
      return null;

    const newNodeIdsMap: Record<string, string> = {};

    const nodes = elements.nodes.map(({ data, position, type, id }) => {
      const nodeId = nanoid();
      newNodeIdsMap[id] = nodeId;

      return { id: nodeId, type, data, position };
    }) as WorkflowNewNode[];
    const edges: Connection[] = elements.edges.map(
      ({ source, sourceHandle, target, targetHandle }) => ({
        source: newNodeIdsMap[source] || source,
        target: newNodeIdsMap[target] || target,
        sourceHandle: sourceHandle || '',
        targetHandle: targetHandle || '',
      }),
    );

    if (nodes.length > 0) {
      addNodes(nodes);
      storeApi.getState().addSelectedNodes(nodes.map((node) => node.id!));
    }
    if (edges.length > 0) addEdges(edges);

    return null;
  }
  async function copyElements(
    { edges, nodes }: { nodes?: WorkflowNodes[]; edges?: WorkflowEdges[] },
    cut?: boolean,
  ) {
    const workflowClipboardData: WorkflowClipboardData = {
      edges: edges || [],
      nodes: nodes || [],
    };

    const result = await preloadAPI.main.ipc.invoke(
      'clipboard:copy-buffer',
      WORKFLOW_ELEMENT_FORMAT,
      JSON.stringify(workflowClipboardData),
    );
    if (isIPCEventError(result)) {
      toast({
        title: 'Error',
        variant: 'destructive',
        description: result.message,
      });

      return;
    }

    if (!cut) return;

    deleteElements({ nodes, edges });
  }
  function runCurrentWorkflow({
    maxStep,
    emitEvents,
    startNodeId,
    ...rest
  }: Partial<
    Pick<
      WorkflowRunPayload,
      | 'maxStep'
      | 'emitEvents'
      | 'startNodeId'
      | 'finishNodeId'
      | 'customElement'
    >
  > = {}) {
    const { workflow } = useWorkflowEditorStore.getState();
    if (!workflow) return null;

    const manualTriggerNode = !startNodeId
      ? workflow.nodes.find((node) => node.type === WORKFLOW_NODE_TYPE.TRIGGER)
      : null;
    if (!startNodeId && !manualTriggerNode) {
      toast({
        variant: 'destructive',
        title: "Couldn't find a Manual Trigger node",
        description: 'Add a Manual Trigger node to run the workflow manually',
      });
      return null;
    }

    return preloadAPI.main.ipc
      .invoke('workflow:execute', {
        maxStep,
        emitEvents,
        id: workflow.id,
        startNodeId:
          startNodeId || (manualTriggerNode?.id ?? WORKFLOW_MANUAL_TRIGGER_ID),
        ...rest,
      })
      .catch((error) => {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Something went wrong!',
          description: `Something went wrong when running the "${workflow.name}" workfow`,
        });

        return null;
      });
  }

  return {
    ...context,
    unselectAll,
    copyElements,
    pasteElements,
    selectAllNodes,
    runCurrentWorkflow,
  };
}
