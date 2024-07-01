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
  NodeMouseHandler,
  OnNodesDelete,
  IsValidConnection,
  NodeDragHandler,
  XYPosition,
  OnEdgesDelete,
  SelectionDragHandler,
  OnInit,
  useStoreApi,
} from 'reactflow';
import WorkflowEditorHeader from '/@/components/workflow/editor/WorkflowEditorHeader';
import WorkflowEditorControls, {
  WorkflowUndoRedo,
} from '/@/components/workflow/editor/WorkflowEditorControls';
import {
  WorkflowEditorStore,
  useWorkflowEditorStore,
} from '/@/stores/workflow-editor/workflow-editor.store';
import { useShallow } from 'zustand/react/shallow';
import { WorkflowEditorProvider } from '/@/context/workflow-editor.context';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { WorkflowEditorContextMenuType } from '/@/interface/workflow-editor.interface';
import WorkflowEditorContextMenu from '/@/components/workflow/editor/WorkflowEditorContextMenu';
import {
  WORKFLOW_NODE_TRIGGERS,
  WORKFLOW_NODE_TYPE,
} from '#packages/common/utils/constant/workflow.const';
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
import { WorkflowEditorNodeListModal } from '/@/components/workflow/editor/WorkflowEditorNodeLIst';

const defaultNodeTypes = Object.values(WORKFLOW_NODE_TYPE).reduce<
  Partial<Record<WORKFLOW_NODE_TYPE, React.FC<NodeProps>>>
>((acc, curr) => {
  acc[curr] = WorkflowNodeBasic;

  return acc;
}, {});
const nodeTypes: Partial<
  Record<WORKFLOW_NODE_TYPE | 'default', React.FC<NodeProps>>
> = {
  ...defaultNodeTypes,
  default: WorkflowNodeBasic,
  [WORKFLOW_NODE_TYPE.LOOP]: WorkflowNodeLoop,
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeCommand,
  [WORKFLOW_NODE_TYPE.CONDITIONAL]: WorkflowNodeConditional,
};

const edgeTypes = {
  default: WorkflowEdgeDefault,
};

const selector = (state: WorkflowEditorStore) => ({
  addEdges: state.addEdges,
  edges: state.workflow?.edges,
  nodes: state.workflow?.nodes,
  updateEdge: state.updateEdge,
  addCommands: state.addCommands,
  setEditNode: state.setEditNode,
  deleteEdgeBy: state.deleteEdgeBy,
  setSelection: state.setSelection,
  viewport: state.workflow?.viewport,
  applyElementChanges: state.applyElementChanges,
});
const nodeConnectionValidator: IsValidConnection = (edge) => {
  return edge.source !== edge.target;
};

function WorkflowEditor() {
  const storeApi = useStoreApi();
  const { event: workflowEditorEvent } = useWorkflowEditor();

  const connectingNodeEdge = useRef<{
    nodeId: string;
    handleId: string;
  } | null>(null);
  const applyChanges = useRef(false);
  const nodeMoveChanges = useRef<Map<string, XYPosition> | null>(null);

  const {
    edges,
    nodes,
    viewport,
    addEdges,
    updateEdge,
    addCommands,
    setEditNode,
    deleteEdgeBy,
    setSelection,
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
      addEdges([connection]);
    },
    [addEdges],
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
      deleteEdgeBy('id', [edge.id]);
    },
    [deleteEdgeBy],
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
  const onInit: OnInit = useCallback(
    (reactFlow) => {
      setTimeout(() => {
        applyChanges.current = true;
      }, 500);

      const searchParams = new URLSearchParams(window.location.search);
      if (!searchParams.has('toNode')) return;

      const node = reactFlow.getNode(searchParams.get('toNode') ?? '');
      if (!node) return;

      reactFlow.setCenter(node.position.x, node.position.y);
      storeApi.getState().addSelectedNodes([node.id]);
    },
    [storeApi],
  );
  const onNodesDelete: OnNodesDelete = useCallback(
    (nodes) => {
      addCommands([{ type: 'node-removed', nodes: nodes as WorkflowNodes[] }]);

      const triggerDeleted = nodes.some(
        (node) => node.type && WORKFLOW_NODE_TRIGGERS.includes(node.type),
      );
      if (triggerDeleted) {
        useWorkflowEditorStore.setState({ isTriggerChanged: true });
      }

      const { editNode } = useWorkflowEditorStore.getState();
      const closeEditNodePanel =
        editNode && nodes.some((node) => node.id === editNode.id);
      if (!closeEditNodePanel) return;

      setEditNode(null);
    },
    [setEditNode, addCommands],
  );
  const onNodeDragStop: NodeDragHandler = useCallback(
    (_event, _node, nodes) => {
      const positions = nodeMoveChanges.current;
      if (!positions) return;

      const filteredNodes = nodes.reduce<Map<string, XYPosition>>(
        (acc, node) => {
          const prevPosition = positions.get(node.id);
          if (!prevPosition) return acc;

          if (
            Math.abs(node.position.x - prevPosition.x) > 50 ||
            Math.abs(node.position.y - prevPosition.y) > 50
          ) {
            acc.set(node.id, node.position);
          }

          return acc;
        },
        new Map(),
      );
      if (filteredNodes.size === 0) return;

      addCommands([
        {
          type: 'node-move',
          oldPositions: positions,
          positions: filteredNodes,
        },
      ]);

      nodeMoveChanges.current = null;
    },
    [addCommands],
  );
  const onNodeDragStart: NodeDragHandler = useCallback(
    (_event, _node, nodes) => {
      nodeMoveChanges.current = new Map(
        nodes.map((node) => [node.id, node.position]),
      );
    },
    [],
  );
  const onSelectionDragStart: SelectionDragHandler = useCallback((_, nodes) => {
    nodeMoveChanges.current = new Map(
      nodes.map((node) => [node.id, node.position]),
    );
  }, []);
  const onSelectionDragStop: SelectionDragHandler = useCallback(
    (_, nodes) => {
      const positions = nodeMoveChanges.current;
      if (!positions) return;

      const filteredNodes = nodes.reduce<Map<string, XYPosition>>(
        (acc, node) => {
          const prevPosition = positions.get(node.id);
          if (!prevPosition) return acc;

          if (
            Math.abs(node.position.x - prevPosition.x) > 50 ||
            Math.abs(node.position.y - prevPosition.y) > 50
          ) {
            acc.set(node.id, node.position);
          }

          return acc;
        },
        new Map(),
      );
      if (filteredNodes.size === 0) return;

      addCommands([
        {
          type: 'node-move',
          oldPositions: positions,
          positions: filteredNodes,
        },
      ]);

      nodeMoveChanges.current = null;
    },
    [addCommands],
  );
  const onEdgesDelete: OnEdgesDelete = useCallback(
    (edges) => {
      const seen = new Set<string>();
      const deletedEdges = edges.filter((edge) => {
        if (seen.has(edge.id)) return false;

        seen.add(edge.id);

        return true;
      });
      addCommands([{ type: 'edge-removed', edges: deletedEdges }]);
    },
    [addCommands],
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
      onEdgesDelete={onEdgesDelete}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodesDelete={onNodesDelete}
      onConnectStart={onConnectStart}
      onNodeDragStop={onNodeDragStop}
      onNodeDragStart={onNodeDragStart}
      onPaneContextMenu={onPaneContextMenu}
      onNodeContextMenu={onNodeContextMenu}
      onEdgeDoubleClick={onEdgeDoubleClick}
      onEdgeContextMenu={onEdgeContextMenu}
      onNodeDoubleClick={onNodeDoubleClick}
      defaultViewport={viewport ?? undefined}
      onSelectionDragStop={onSelectionDragStop}
      onSelectionDragStart={onSelectionDragStart}
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
  }, [workflowId, navigate, queryDatabase, hideSidebar, setWorkflow]);

  return (
    <WorkflowEditorProvider>
      <ReactFlowProvider>
        <WorkflowEditorContextMenu />
        <div className="relative w-full h-screen flex flex-col">
          <WorkflowEditorHeader />
          <div className="flex-grow flex relative">
            <WorkflowEditorNodeListModal />
            <WorkflowEditor />
            <Panel position="bottom-right">
              <WorkflowUndoRedo />
            </Panel>
            <WorkflowEditorEditNode />
          </div>
        </div>
        <WorkflowEventListener />
      </ReactFlowProvider>
    </WorkflowEditorProvider>
  );
}

export default RouteWorkflow;
