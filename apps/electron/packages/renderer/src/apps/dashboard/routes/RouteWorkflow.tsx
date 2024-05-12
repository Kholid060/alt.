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
  EdgeMouseHandler,
  OnSelectionChangeFunc,
  OnEdgesChange,
  OnNodesChange,
  addEdge,
  NodeMouseHandler,
  OnNodesDelete,
  IsValidConnection,
} from 'reactflow';
import WorkflowEditorHeader from '/@/components/workflow/editor/WorkflowEditorHeader';
import WorkflowEditorControls from '/@/components/workflow/editor/WorkflowEditorControls';
import { WorkflowEditorNodeListModal } from '../../../components/workflow/editor/WorkflowEditorNodeList';
import {
  WorkflowEditorStore,
  useWorkflowEditorStore,
} from '/@/stores/workflow-editor.store';
import { useShallow } from 'zustand/react/shallow';
import { WorkflowEditorProvider } from '/@/context/workflow-editor.context';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { WorkflowEditorContextMenuType } from '/@/interface/workflow-editor.interface';
import WorkflowEditorContextMenu from '/@/components/workflow/editor/WorkflowEditorContextMenu';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import WorkflowEdgeDefault from '/@/components/workflow/edge/WorkflowEdgeDefault';
import {
  WorkflowNodeBasic,
  WorkflowNodeCommand,
  WorkflowNodeConditional,
  WorkflowNodeLoop,
} from '/@/components/workflow/WorkflowNodes';
import { useDatabase } from '/@/hooks/useDatabase';
import { useNavigate, useParams } from 'react-router-dom';
import { debugLog } from '#packages/common/utils/helper';
import { useDashboardStore } from '/@/stores/dashboard.store';
import WorkflowEditorEditNode from '/@/components/workflow/editor/WorkflowEditorEditNode';
import { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';
import WorkflowEventListener from '/@/components/workflow/WorkflowEventListener';

const nodeTypes: Record<WORKFLOW_NODE_TYPE, React.FC<NodeProps>> = {
  [WORKFLOW_NODE_TYPE.LOOP]: WorkflowNodeLoop,
  [WORKFLOW_NODE_TYPE.CODE]: WorkflowNodeBasic,
  [WORKFLOW_NODE_TYPE.DELAY]: WorkflowNodeBasic,
  [WORKFLOW_NODE_TYPE.TRIGGER]: WorkflowNodeBasic,
  [WORKFLOW_NODE_TYPE.CLIPBOARD]: WorkflowNodeBasic,
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeCommand,
  [WORKFLOW_NODE_TYPE.DO_NOTHING]: WorkflowNodeBasic,
  [WORKFLOW_NODE_TYPE.FILE_SYSTEM]: WorkflowNodeBasic,
  [WORKFLOW_NODE_TYPE.HTTP_REQUEST]: WorkflowNodeBasic,
  [WORKFLOW_NODE_TYPE.CONDITIONAL]: WorkflowNodeConditional,
};
const edgeTypes = {
  default: WorkflowEdgeDefault,
};

const selector = (state: WorkflowEditorStore) => ({
  edges: state.workflow?.edges,
  nodes: state.workflow?.nodes,
  deleteEdge: state.deleteEdge,
  updateEdge: state.updateEdge,
  setEditNode: state.setEditNode,
  setSelection: state.setSelection,
  viewport: state.workflow?.viewport,
  updateWorkflow: state.updateWorkflow,
  applyElementChanges: state.applyElementChanges,
});
const nodeConnectionValidator: IsValidConnection = (edge) => {
  return edge.source !== edge.target;
};

function WorkflowEditor() {
  const { event: workflowEditorEvent } = useWorkflowEditor();

  const connectingNodeEdge = useRef<{
    nodeId: string;
    handleId: string;
  } | null>(null);
  const applyChanges = useRef(false);

  const {
    edges,
    nodes,
    viewport,
    updateEdge,
    deleteEdge,
    setEditNode,
    setSelection,
    updateWorkflow,
    applyElementChanges,
  } = useWorkflowEditorStore(useShallow(selector));

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
    (_event, { handleId, nodeId, handleType }) => {
      if (!handleId || !nodeId || handleType !== 'source') {
        connectingNodeEdge.current = null;
        return;
      }
      connectingNodeEdge.current = { handleId, nodeId };
    },
    [],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => {
      connectingNodeEdge.current = null;
      updateWorkflow((workflow) => ({
        edges: addEdge(connection, workflow.edges),
      }));
    },
    [updateWorkflow],
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

  const onEdgeUpdate: OnEdgeUpdateFunc = useCallback(
    (oldEdge, newConnection) => {
      updateEdge(oldEdge, newConnection);
    },
    [updateEdge],
  );
  const onEdgeDoubleClick: EdgeMouseHandler = useCallback(
    (_, edge) => {
      deleteEdge(edge.id);
    },
    [deleteEdge],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (edges) => {
      if (!applyChanges.current) return;

      applyElementChanges({ edges });
    },
    [applyElementChanges],
  );
  const onNodesChange: OnNodesChange = useCallback(
    (nodes) => {
      if (!applyChanges.current) return;

      applyElementChanges({ nodes });
    },
    [applyElementChanges],
  );
  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_, node) => {
      setEditNode(node as WorkflowNodes);
    },
    [setEditNode],
  );
  const onInit = useCallback(() => {
    setTimeout(() => {
      applyChanges.current = true;
    }, 500);
  }, []);
  const onNodesDelete: OnNodesDelete = useCallback(
    (nodes) => {
      const { editNode } = useWorkflowEditorStore.getState();
      const closeEditNodePanel =
        editNode && nodes.some((node) => node.id === editNode.id);
      if (!closeEditNodePanel) return;

      setEditNode(null);
    },
    [setEditNode],
  );

  if (!nodes || !edges) return null;

  return (
    <ReactFlow
      nodes={nodes}
      tabIndex={-1}
      edges={edges}
      onInit={onInit}
      className="flex-grow focus:outline-none"
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      elevateNodesOnSelect
      onConnect={onConnect}
      onConnectEnd={onConnectEnd}
      onEdgeUpdate={onEdgeUpdate}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodesDelete={onNodesDelete}
      onConnectStart={onConnectStart}
      onPaneContextMenu={onPaneContextMenu}
      onNodeContextMenu={onNodeContextMenu}
      onEdgeDoubleClick={onEdgeDoubleClick}
      onEdgeContextMenu={onEdgeContextMenu}
      onNodeDoubleClick={onNodeDoubleClick}
      defaultViewport={viewport ?? undefined}
      isValidConnection={nodeConnectionValidator}
      onSelectionContextMenu={onSelectionContextMenu}
      onSelectionChange={setSelection as OnSelectionChangeFunc}
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
  );
}

function RouteWorkflow() {
  const hideSidebar = useDashboardStore.use.setHideSidebar();
  const setWorkflow = useWorkflowEditorStore.use.setWorkflow();

  const navigate = useNavigate();
  const { workflowId } = useParams();
  const { queryDatabase } = useDatabase();

  useEffect(() => {
    const offQueryListener = queryDatabase({
      name: 'database:get-workflow',
      args: [workflowId!],
      onData(data) {
        if (!data) {
          navigate('/workflows');
          return;
        }

        setWorkflow(data);
      },
      onError(message) {
        debugLog('Error: ', message);
      },
    });
    hideSidebar(true);

    return () => {
      offQueryListener();
      hideSidebar(false);
      useWorkflowEditorStore.getState().$reset();
    };
  }, [workflowId, navigate]);

  return (
    <WorkflowEditorProvider>
      <ReactFlowProvider>
        <WorkflowEditorContextMenu />
        <div className="relative w-full h-screen flex flex-col">
          <WorkflowEditorHeader />
          <div className="flex-grow flex relative">
            <WorkflowEditorNodeListModal />
            <WorkflowEditor />
            <WorkflowEditorEditNode />
          </div>
        </div>
        <WorkflowEventListener />
      </ReactFlowProvider>
    </WorkflowEditorProvider>
  );
}

export default RouteWorkflow;
