import { useCallback, useRef } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  Node,
  NodeProps,
  OnConnect,
  OnConnectEnd,
  OnConnectStart,
  Panel,
  ReactFlowProvider,
} from 'reactflow';

import 'reactflow/dist/style.css';
import WorkflowEditorHeader from '/@/components/workflow/editor/WorkflowEditorHeader';
import WorkflowEditorControls from '/@/components/workflow/editor/WorkflowEditorControls';
import WorkflowNodeBase from '/@/components/workflow/node/WorkflowNodeBase';
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

const nodeTypes: Record<WORKFLOW_NODE_TYPE, React.FC<NodeProps>> = {
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeBase,
};

const selector = (state: WorkflowEditorStore) => ({
  nodes: state.nodes,
  edges: state.edges,
  onConnect: state.onConnect,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
});

function WorkflowEditor() {
  const { event: workflowEditorEvent } = useWorkflowEditor();

  const connectingNodeEdge = useRef<{
    nodeId: string;
    handleId: string;
  } | null>(null);

  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } =
    useWorkflowStore(useShallow(selector));

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

  return (
    <div className="relative w-full h-screen flex flex-col">
      <WorkflowEditorHeader />
      <div className="flex-grow flex relative">
        <WorkflowEditorNodeListModal />
        <ReactFlow
          className="flex-grow"
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onConnect={onEditorConnect}
          onConnectEnd={onConnectEnd}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={onConnectStart}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
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
