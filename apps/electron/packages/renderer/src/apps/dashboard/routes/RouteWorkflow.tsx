import { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Edge,
  Node,
  Panel,
  NodeProps,
  OnConnect,
  Background,
  OnConnectEnd,
  OnConnectStart,
  OnEdgeUpdateFunc,
  BackgroundVariant,
  ReactFlowProvider,
} from 'reactflow';
import '/@/assets/css/workflow-editor-style.css';
import WorkflowEditorHeader from '/@/components/workflow/editor/WorkflowEditorHeader';
import WorkflowEditorControls from '/@/components/workflow/editor/WorkflowEditorControls';
import { WorkflowEditorNodeListModal } from '/@/components/workflow/editor/WorkflowEditorNodeLIst';
import {
  WorkflowEditorStore,
  useWorkflowStore,
} from '/@/stores/workflow-editor.store';
import { useShallow } from 'zustand/react/shallow';
import { WorkflowEditorProvider } from '/@/context/workflow-editor.context';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { WorkflowEditorContextMenuType } from '/@/interface/workflow-editor.interface';
import WorkflowEditorContextMenu from '/@/components/workflow/editor/WorkflowEditorContextMenu';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import WorkflowEdgeDefault from '/@/components/workflow/edge/WorkflowEdgeDefault';
import {
  WorkflowNodeCommand,
  WorkflowNodeTrigger,
} from '/@/components/workflow/WorkflowNodes';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { useParams } from 'react-router-dom';

const nodeTypes: Record<WORKFLOW_NODE_TYPE, React.FC<NodeProps>> = {
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeCommand,
  [WORKFLOW_NODE_TYPE.TRIGGER]: WorkflowNodeTrigger,
};
const edgeTypes = {
  default: WorkflowEdgeDefault,
};

const selector = (state: WorkflowEditorStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  onConnect: state.onConnect,
  deleteEdge: state.deleteEdge,
  updateEdge: state.updateEdge,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  onSelectionChange: state.onSelectionChange,
});

function WorkflowEditor() {
  const { event: workflowEditorEvent } = useWorkflowEditor();

  const connectingNodeEdge = useRef<{
    nodeId: string;
    handleId: string;
  } | null>(null);
  const edgeUpdateSuccessful = useRef(true);

  const {
    nodes,
    edges,
    onConnect,
    updateEdge,
    deleteEdge,
    onNodesChange,
    onEdgesChange,
    onSelectionChange,
  } = useWorkflowStore(useShallow(selector));

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      if (
        !connectingNodeEdge.current ||
        !(event.target instanceof HTMLElement) ||
        !(event instanceof MouseEvent)
      ) {
        return;
      }

      const targetIsPane = event.target.classList.contains('react-flow__pane');
      if (!targetIsPane) return;

      workflowEditorEvent.emit('node-list-modal:open', {
        position: {
          x: event.clientX,
          y: event.clientY,
        },
        sourceEdge: connectingNodeEdge.current,
      });
    },
    [workflowEditorEvent],
  );
  const onConnectStart: OnConnectStart = useCallback(
    (_event, { handleId, nodeId }) => {
      if (!handleId || !nodeId) return;
      connectingNodeEdge.current = { handleId, nodeId };
    },
    [],
  );
  const onEditorConnect: OnConnect = useCallback(
    (...args) => {
      connectingNodeEdge.current = null;
      onConnect(...args);
    },
    [onConnect],
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) =>
      workflowEditorEvent.emit('context-menu:open', {
        type: WorkflowEditorContextMenuType.PANE,
        position: { x: event.clientX, y: event.clientY },
      }),
    [workflowEditorEvent],
  );
  const onNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) =>
      workflowEditorEvent.emit('context-menu:open', {
        nodeId: node.id,
        type: WorkflowEditorContextMenuType.NODE,
        position: { x: event.clientX, y: event.clientY },
      }),
    [workflowEditorEvent],
  );
  const onEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) =>
      workflowEditorEvent.emit('context-menu:open', {
        edgeId: edge.id,
        type: WorkflowEditorContextMenuType.EDGE,
        position: { x: event.clientX, y: event.clientY },
      }),
    [workflowEditorEvent],
  );
  const onSelectionContextMenu = useCallback(
    (event: React.MouseEvent, nodes: Node[]) =>
      workflowEditorEvent.emit('context-menu:open', {
        nodeIds: nodes.map((node) => node.id),
        type: WorkflowEditorContextMenuType.SELECTION,
        position: { x: event.clientX, y: event.clientY },
      }),
    [workflowEditorEvent],
  );

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);
  const onEdgeUpdate: OnEdgeUpdateFunc = useCallback(
    (oldEdge, newConnection) => {
      edgeUpdateSuccessful.current = true;
      updateEdge(oldEdge, newConnection);
    },
    [updateEdge],
  );
  const onEdgeUpdateEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      if (!edgeUpdateSuccessful.current) {
        deleteEdge(edge.id);
      }

      edgeUpdateSuccessful.current = true;
    },
    [deleteEdge],
  );

  return (
    <div className="relative w-full h-screen flex flex-col">
      <WorkflowEditorHeader />
      <div className="flex-grow flex relative">
        <WorkflowEditorNodeListModal />
        <ReactFlow
          nodes={nodes}
          edges={edges}
          className="flex-grow"
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onConnect={onEditorConnect}
          onConnectEnd={onConnectEnd}
          onEdgeUpdate={onEdgeUpdate}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={onConnectStart}
          onEdgeUpdateEnd={onEdgeUpdateEnd}
          onEdgeUpdateStart={onEdgeUpdateStart}
          onPaneContextMenu={onPaneContextMenu}
          onSelectionChange={onSelectionChange}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          onSelectionContextMenu={onSelectionContextMenu}
        >
          <Panel position="bottom-left">
            <WorkflowEditorControls />
          </Panel>
          <Background
            variant={BackgroundVariant.Dots}
            gap={12}
            size={1}
            color="currentColor"
            className="text-foreground/15"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

function RouteWorkflow() {
  return (
    <WorkflowEditorProvider>
      <ReactFlowProvider>
        <WorkflowEditorContextMenu />
        <WorkflowEditor />
      </ReactFlowProvider>
    </WorkflowEditorProvider>
  );
}

export default RouteWorkflow;
