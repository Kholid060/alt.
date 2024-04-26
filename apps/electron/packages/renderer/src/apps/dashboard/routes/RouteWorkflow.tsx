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
  useOnViewportChange,
  EdgeMouseHandler,
} from 'reactflow';
import '/@/assets/css/workflow-editor-style.css';
import WorkflowEditorHeader from '/@/components/workflow/editor/WorkflowEditorHeader';
import WorkflowEditorControls from '/@/components/workflow/editor/WorkflowEditorControls';
import { WorkflowEditorNodeListModal } from '/@/components/workflow/editor/WorkflowEditorNodeLIst';
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
  WorkflowNodeCommand,
  WorkflowNodeTrigger,
} from '/@/components/workflow/WorkflowNodes';
import { useDatabase } from '/@/hooks/useDatabase';
import { useNavigate, useParams } from 'react-router-dom';
import { debounce } from '@repo/shared';
import preloadAPI from '/@/utils/preloadAPI';
import { DatabaseWorkflowUpdatePayload } from '#packages/main/src/interface/database.interface';

const nodeTypes: Record<WORKFLOW_NODE_TYPE, React.FC<NodeProps>> = {
  [WORKFLOW_NODE_TYPE.COMMAND]: WorkflowNodeCommand,
  [WORKFLOW_NODE_TYPE.TRIGGER]: WorkflowNodeTrigger,
};
const edgeTypes = {
  default: WorkflowEdgeDefault,
};

const selector = (state: WorkflowEditorStore) => ({
  workflow: state.workflow,
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

  const {
    workflow,
    onConnect,
    updateEdge,
    deleteEdge,
    onNodesChange,
    onEdgesChange,
    onSelectionChange,
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

  if (!workflow) return null;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <WorkflowEditorHeader />
      <div className="flex-grow flex relative">
        <WorkflowEditorNodeListModal />
        <ReactFlow
          nodes={workflow.nodes}
          edges={workflow.edges}
          className="flex-grow"
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onConnect={onEditorConnect}
          onConnectEnd={onConnectEnd}
          onEdgeUpdate={onEdgeUpdate}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnectStart={onConnectStart}
          onPaneContextMenu={onPaneContextMenu}
          onSelectionChange={onSelectionChange}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeDoubleClick={onEdgeDoubleClick}
          onEdgeContextMenu={onEdgeContextMenu}
          onSelectionContextMenu={onSelectionContextMenu}
          defaultViewport={workflow.viewport ?? undefined}
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
function WokflowViewportChangesListener() {
  const updateWorkflow = useWorkflowEditorStore.use.updateWorkflow();
  useOnViewportChange({
    onEnd: (viewport) => {
      updateWorkflow({ viewport });
    },
  });

  return null;
}

const WORKFLOW_CHANGES_DEBOUNCE_MS = 2000;
function RouteWorkflow() {
  const setWorkflow = useWorkflowEditorStore.use.setWorkflow();

  const navigate = useNavigate();
  const { workflowId } = useParams();
  const { queryDatabase } = useDatabase();

  const dataFetched = useRef(false);

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
        setTimeout(() => {
          dataFetched.current = true;
        }, WORKFLOW_CHANGES_DEBOUNCE_MS + 100);
      },
      onError(message) {
        console.log('Error: ', message);
      },
    });

    return () => {
      offQueryListener();
      useWorkflowEditorStore.getState().$reset();
    };
  }, [workflowId, navigate]);
  useEffect(
    () =>
      useWorkflowEditorStore.subscribe(
        (state) => state.workflow,
        debounce(async (workflow) => {
          if (!dataFetched.current || !workflow) return;

          try {
            const { workflowChanges: changes, clearWorkflowChanges } =
              useWorkflowEditorStore.getState();
            if (changes.size === 0) return;

            const payload: DatabaseWorkflowUpdatePayload = {};
            changes.forEach((key) => {
              //@ts-expect-error ...
              payload[key] = workflow[key];
            });

            await preloadAPI.main.invokeIpcMessage(
              'database:update-workflow',
              workflow.id,
              payload,
            );
            clearWorkflowChanges();

            if (import.meta.env.DEV) {
              console.log('Save workflow', changes);
            }
          } catch (error) {
            console.error(error);
          }
        }, WORKFLOW_CHANGES_DEBOUNCE_MS),
      ),
    [],
  );

  return (
    <WorkflowEditorProvider>
      <ReactFlowProvider>
        <WorkflowEditorContextMenu />
        <WorkflowEditor />
        <WokflowViewportChangesListener />
      </ReactFlowProvider>
    </WorkflowEditorProvider>
  );
}

export default RouteWorkflow;
