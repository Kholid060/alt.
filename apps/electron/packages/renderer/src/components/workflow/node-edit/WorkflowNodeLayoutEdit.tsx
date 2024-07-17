import {
  UiList,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
  UiBadge,
  UiTooltip,
  UiSelect,
  UiLabel,
  UiButton,
  useToast,
} from '@altdot/ui';
import WorkflowNodeSettings from './WorkflowNodeSettings';
import { WorkflowNodes } from '@altdot/workflow';
import { WORKFLOW_NODES } from '@altdot/workflow';
import { useEffect, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import WorkflowUiCodeEditor from '../ui/WorkflowUiCodeEditor';
import { Edge, Node, getIncomers } from 'reactflow';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor/workflow-editor.store';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { isIPCEventError } from '#packages/common/utils/helper';

function NodeId({ nodeId }: { nodeId: string }) {
  const [copied, setCopied] = useState(false);

  function copyNodeId() {
    preloadAPI.main.ipc.invoke('clipboard:copy', nodeId).then(() => {
      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1000);
    });
  }

  return (
    <UiTooltip label="Node id (click to copy)">
      <button onClick={copyNodeId}>
        <UiBadge variant="secondary" className="max-w-20 flex-shrink-0">
          <span className="line-clamp-1">
            {copied ? '✅Copied' : `${nodeId} _`}
          </span>
        </UiBadge>
      </button>
    </UiTooltip>
  );
}

interface PrevNode {
  id: string;
  step: number;
  type: string;
  title: string;
}

const MAX_DEPTH = 5;
function findPrevNodes(
  {
    edges,
    nodes,
    baseNodeId,
    currentNode,
  }: { currentNode: Node; nodes: Node[]; edges: Edge[]; baseNodeId: string },
  {
    depth,
    prevNodes,
    seen,
  }: {
    depth: number;
    seen: Set<string>;
    prevNodes: PrevNode[];
  } = { depth: 1, prevNodes: [], seen: new Set() },
) {
  if (depth >= MAX_DEPTH) return prevNodes;

  const incomers = getIncomers(currentNode, nodes, edges);
  incomers.forEach((node) => {
    if (node.id === baseNodeId || seen.has(node.id)) return;

    const nodeData = WORKFLOW_NODES[node.type as WORKFLOW_NODE_TYPE];
    if (!nodeData) return;

    seen.add(node.id);
    prevNodes.push({
      id: node.id,
      step: depth,
      type: nodeData.type,
      title: nodeData.title,
    });

    findPrevNodes(
      { currentNode: node, edges, nodes, baseNodeId },
      { prevNodes, depth: depth + 1, seen },
    );
  });

  return prevNodes;
}
function NodeExecution({ node }: { node: WorkflowNodes }) {
  const workflowDisabled = useWorkflowEditorStore((state) =>
    Boolean(state.workflow?.isDisabled),
  );

  const { toast } = useToast();
  const { runCurrentWorkflow } = useWorkflowEditor();

  const [nodeId, setNodeId] = useState(node.id);
  const [prevNodes, setPrevNodes] = useState<PrevNode[]>([]);
  const [outputs, setOutputs] = useState<
    Record<
      string,
      { nodeId: string; isLoading: boolean; output: string; isError?: boolean }
    >
  >({});

  async function executeNode() {
    if (!nodeId) return;

    if (workflowDisabled) {
      toast({
        variant: 'destructive',
        title: 'Workflow disabled',
      });
      return;
    }

    const result = await runCurrentWorkflow({
      emitEvents: {
        'node:execute-error': true,
        'node:execute-finish': true,
      },
      maxStep: 1,
      customElement: {
        edges: [],
        nodes: [node],
      },
      startNodeId: nodeId,
    });
    if (isIPCEventError(result)) {
      toast({
        variant: 'destructive',
        description: result.message,
        title: 'Error when executing node',
      });
      return;
    }
    if (!result) return;

    setOutputs({
      ...outputs,
      [nodeId]: {
        nodeId,
        output: '',
        isLoading: true,
      },
    });
  }

  useEffect(() => {
    const { nodes, edges } = useWorkflowEditorStore.getState().workflow ?? {
      nodes: [],
      edges: [],
    };

    setPrevNodes(
      findPrevNodes({ currentNode: node, edges, nodes, baseNodeId: node.id }),
    );
  }, [node]);
  useEffect(() => {
    const offWorkflowEvents = preloadAPI.main.ipc.on(
      'shared-process:workflow-events',
      (_, events) => {
        const [execNode, data] =
          (events['node:execute-finish'] || events['node:execute-error']) ?? [];
        if (!execNode) return;

        setOutputs((prevData) => ({
          ...prevData,
          [execNode.id]: {
            isLoading: false,
            nodeId: execNode.id,
            output: JSON.stringify(data, null, 2),
            isError: Boolean(events['node:execute-error']),
          },
        }));
      },
    );

    return () => {
      offWorkflowEvents();
    };
  }, []);

  const editorValue =
    outputs[nodeId] && !outputs[nodeId].isLoading ? outputs[nodeId].output : '';

  return (
    <>
      <UiLabel className="ml-1" htmlFor="select-node">
        Node
      </UiLabel>
      <div className="flex items-end">
        <UiSelect
          value={nodeId}
          inputSize="sm"
          id="select-node"
          placeholder="Select node"
          className="overflow-hidden [&>span]:line-clamp-1"
          onValueChange={setNodeId}
        >
          <UiSelect.Option value={node.id}>Current node</UiSelect.Option>
          <UiSelect.Group>
            <UiSelect.Label className="cursor-default">
              Previous nodes
            </UiSelect.Label>
            {prevNodes.map((node) => (
              <UiSelect.Option
                key={node.id}
                value={node.id}
                textValue={node.title}
              >
                {node.title} {`(${node.step} step back)`}
              </UiSelect.Option>
            ))}
          </UiSelect.Group>
        </UiSelect>
        <UiButton
          size="sm"
          variant="secondary"
          className="relative ml-2"
          onClick={executeNode}
          disabled={outputs[nodeId]?.isLoading}
        >
          Execute
          {outputs[nodeId]?.isLoading && (
            <div className="absolute flex h-full w-full cursor-default items-center justify-center rounded-md bg-inherit bg-secondary">
              <Loader2Icon className="animate-spin" />
            </div>
          )}
        </UiButton>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between">
          <p className="ml-1">Output</p>
          {outputs[nodeId]?.isError && (
            <p className="flex cursor-default items-center gap-1 text-destructive-text">
              <TriangleAlertIcon className="size-4" />
              error
            </p>
          )}
        </div>
        <WorkflowUiCodeEditor
          readOnly
          lang="js"
          hideHeader
          value={editorValue}
          placeholder="Node output"
        />
      </div>
    </>
  );
}

interface WorkflowNodeLayoutEditProps {
  title?: string;
  subtitle?: string;
  node: WorkflowNodes;
  icon?: React.ReactNode;
  tabsSlot?: React.ReactNode;
  children?: React.ReactNode;
  tabContentSlot?: React.ReactNode;
}
function WorkflowNodeLayoutEdit({
  node,
  icon,
  title,
  tabsSlot,
  subtitle,
  children,
  tabContentSlot,
}: WorkflowNodeLayoutEditProps) {
  const nodeData = WORKFLOW_NODES[node.type];

  return (
    <>
      <div className="flex items-center gap-2 p-4 pb-2">
        <div className="h-10 w-10">
          {icon ? icon : <UiList.Icon icon={nodeData.icon} />}
        </div>
        <div className="flex-grow">
          <p className="leading-tight">{title || nodeData.title} </p>
          <p className="text-sm text-muted-foreground">
            {subtitle || nodeData.subtitle}
          </p>
        </div>
        <NodeId nodeId={node.id} />
      </div>
      <UiTabs variant="line" defaultValue="parameters">
        <UiTabsList className="sticky top-0 z-50 bg-background">
          <UiTabsTrigger value="parameters">Parameters</UiTabsTrigger>
          <UiTabsTrigger value="execute-node">Preview node</UiTabsTrigger>
          <UiTabsTrigger value="settings">Settings</UiTabsTrigger>
          {tabsSlot}
        </UiTabsList>
        <UiTabsContent value="parameters" className="mt-0 p-4">
          {children}
        </UiTabsContent>
        <UiTabsContent value="execute-node" className="mt-0 p-4">
          <NodeExecution node={node} />
        </UiTabsContent>
        <UiTabsContent value="settings" className="mt-0 p-4">
          <WorkflowNodeSettings data={node.data} />
        </UiTabsContent>
        {tabContentSlot}
      </UiTabs>
    </>
  );
}

export default WorkflowNodeLayoutEdit;
