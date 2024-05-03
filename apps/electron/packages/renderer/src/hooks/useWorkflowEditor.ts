import { useContext } from 'react';
import { WorkflowEditorContext } from '../context/workflow-editor.context';
import {
  WorkflowClipboardData,
  WorkflowNewNode,
} from '#packages/common/interface/workflow.interface';
import {
  APP_WORKFLOW_ELS_FORMAT,
  WORKFLOW_NODE_TYPE,
} from '#packages/common/utils/constant/constant';
import { parseJSON } from '@repo/shared';
import { nanoid } from 'nanoid';
import { Connection, useStore, useStoreApi } from 'reactflow';
import { isIPCEventError } from '../utils/helper';
import preloadAPI from '../utils/preloadAPI';
import { useWorkflowEditorStore } from '../stores/workflow-editor.store';
import { useShallow } from 'zustand/react/shallow';
import { useToast } from '@repo/ui';

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

  function selectAllNodes() {
    const nodes = storeApi.getState().getNodes();
    storeApi.getState().addSelectedNodes(nodes.map((node) => node.id));
  }
  async function pasteElements() {
    const copiedElements = await preloadAPI.main.ipc.invoke(
      'clipboard:read-buffer',
      APP_WORKFLOW_ELS_FORMAT,
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

    if (nodes.length > 0) addNodes(nodes);
    if (edges.length > 0) addEdges(edges);

    return null;
  }
  function copyElements(element: { nodeId?: string; edgeId?: string }) {
    const state = useWorkflowEditorStore.getState();
    if (!state.workflow) return;

    const { edges, nodes } = state.selection;
    let workflowClipboardData: WorkflowClipboardData | null = null;

    if (edges.length > 0 || nodes.length > 0) {
      workflowClipboardData = { edges, nodes };
    } else if (element?.nodeId) {
      const node = state.workflow.nodes.find(
        (item) => item.id === element.nodeId,
      );
      if (!node) return;

      workflowClipboardData = { edges: [], nodes: [node] };
    } else if (element?.edgeId) {
      const edge = state.workflow.edges.find(
        (item) => item.id === element.edgeId,
      );
      if (!edge) return;

      workflowClipboardData = { edges: [edge], nodes: [] };
    }

    if (!workflowClipboardData) return;

    preloadAPI.main.ipc.invoke(
      'clipboard:copy-buffer',
      APP_WORKFLOW_ELS_FORMAT,
      JSON.stringify(workflowClipboardData),
    );
  }
  function runCurrentWorkflow(startNodeId?: string) {
    const { workflow } = useWorkflowEditorStore.getState();
    if (!workflow) return;

    const manualTriggerNode =
      !startNodeId &&
      workflow.nodes.find(
        (node) =>
          node.type === WORKFLOW_NODE_TYPE.TRIGGER &&
          node.data.type === 'manual',
      );
    if (!startNodeId && !manualTriggerNode) {
      toast({
        variant: 'destructive',
        title: "Couldn't find a Manual Trigger node",
        description: 'Add a Manual Trigger node to run the workflow manually',
      });
      return;
    }

    preloadAPI.main.ipc
      .invoke('workflow:execute', {
        id: workflow.id,
        startNodeId: startNodeId || manualTriggerNode.id,
      })
      .catch((error) => {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Something went wrong!',
          description: `Something went wrong when running the "${workflow.name}" workfow`,
        });
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
