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
import { useEffect, useMemo, useRef, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import WorkflowUiCodeEditor from '../ui/WorkflowUiCodeEditor';
import { Edge, Node, getIncomers } from '@xyflow/react';
import { useWorkflowEditorStore } from '/@/stores/workflow-editor/workflow-editor.store';
import { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { Loader2Icon } from 'lucide-react';
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

  const outputs = useRef<
    {
      name: string;
      nodeId: string;
      output: unknown;
      status: 'error' | 'success';
    }[]
  >([]);

  const [startNodeId, setStartNodeId] = useState(node.id);
  const [isExecuting, setIsExecuting] = useState(false);

  const prevNodes = useMemo(() => {
    const { nodes, edges } = useWorkflowEditorStore.getState().workflow ?? {
      nodes: [],
      edges: [],
    };

    return findPrevNodes({
      edges,
      nodes,
      currentNode: node,
      baseNodeId: node.id,
    });
  }, [node]);

  async function executeNode() {
    if (!startNodeId) return;

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
      startNodeId: startNodeId,
      finishNodeId: node.id,
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

    outputs.current = [];
    setIsExecuting(true);
  }

  useEffect(() => {
    const offWorkflowEvents = preloadAPI.main.ipc.on(
      'workflow:execution-events',
      (_, events) => {
        const [execNode, data] =
          (events['node:execute-finish'] || events['node:execute-error']) ?? [];
        if (!execNode) return;

        if (node.id === execNode.id) setIsExecuting(false);

        outputs.current.unshift({
          nodeId: execNode.id,
          status: Object.hasOwn(events, 'node:execute-error')
            ? 'error'
            : 'success',
          name: execNode.name,
          output: data,
        });
      },
    );

    return () => {
      offWorkflowEvents();
    };
  }, [node.id]);

  return (
    <>
      <UiLabel className="ml-1" htmlFor="select-node">
        Execute from
      </UiLabel>
      <div className="flex items-end">
        <UiSelect
          value={startNodeId}
          inputSize="sm"
          id="select-node"
          placeholder="Select node"
          className="overflow-hidden [&>span]:line-clamp-1"
          onValueChange={setStartNodeId}
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
          disabled={isExecuting}
        >
          Execute
          {isExecuting && (
            <div className="absolute flex h-full w-full cursor-default items-center justify-center rounded-md bg-inherit bg-secondary">
              <Loader2Icon className="animate-spin" />
            </div>
          )}
        </UiButton>
      </div>
      <div className="mt-2">
        <p className="ml-1">Output</p>
        <WorkflowUiCodeEditor
          readOnly
          lang="js"
          hideHeader
          value={
            isExecuting
              ? 'Executing...'
              : JSON.stringify(outputs.current, null, 2)
          }
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
