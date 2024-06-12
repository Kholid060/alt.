import { memo, useEffect, useRef, useState } from 'react';
import {
  Handle,
  NodeProps,
  NodeToolbar,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
} from 'reactflow';
import { WorkflowNodeErroHandlerAction } from '#common/interface/workflow.interface';
import { UiList, UiTooltip } from '@repo/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import type * as NodesType from '#packages/common/interface/workflow-nodes.interface';
import { WORKFLOW_NODES } from '#common/utils/constant/workflow-nodes.const';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/workflow.const';
import clsx from 'clsx';
import {
  BanIcon,
  CircleAlertIcon,
  CopyIcon,
  EllipsisIcon,
  PlayIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  TrashIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useWorkflowEditorStore } from '../../stores/workflow-editor/workflow-editor.store';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { WorkflowEditorContextMenuType } from '/@/interface/workflow-editor.interface';

function NodeHandleWithLabel({
  label,
  handleId,
  className,
  ...props
}: {
  label: string;
  handleId: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'text-xs inline-flex h-5 justify-center bg-background rounded-full items-center custom gap-0.5 border-current absolute -right-2 border-2 -bottom-2',
        className,
      )}
      {...props}
    >
      <p className="pl-1 text-muted-foreground line-clamp-1">{label}</p>
      <Handle
        type="source"
        id={handleId}
        className="flex-shrink-0"
        style={{
          top: 0,
          right: 0,
          width: 16,
          height: 16,
          borderWidth: 2,
          position: 'relative',
          backgroundColor: 'currentcolor',
          transform: 'translate(0px, 0px)',
          borderColor: 'rgb(var(--background))',
        }}
        position={Position.Right}
      ></Handle>
    </div>
  );
}

function NodeToolbarButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        'h-9 w-9 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors inline-flex justify-center items-center',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

function NodeErrorHandlerHandle({
  nodeId,
  errorHandlerAction,
  ...props
}: {
  nodeId: string;
  errorHandlerAction?: NodesType.WorkflowNodeErrorHandler['action'];
} & React.HTMLAttributes<HTMLDivElement>) {
  const updateNodeInternals = useUpdateNodeInternals();
  const prevAction = useRef<WorkflowNodeErroHandlerAction | null>(null);

  useEffect(() => {
    if (!errorHandlerAction || errorHandlerAction === prevAction.current) {
      return;
    }

    prevAction.current = errorHandlerAction;

    updateNodeInternals(nodeId);
  }, [errorHandlerAction, nodeId, updateNodeInternals]);

  if (errorHandlerAction !== 'fallback') return null;

  return (
    <NodeHandleWithLabel
      label="error fallback"
      className="text-destructive"
      handleId={`error-fallback:${nodeId}`}
      {...props}
    />
  );
}
function NodeToolbarMenu({
  nodeId,
  nodeData,
}: {
  nodeId: string;
  nodeData: NodesType.WorkflowNodes['data'];
}) {
  const updateNodeData = useWorkflowEditorStore.use.updateNodeData();

  const { deleteElements, getNode } = useReactFlow();
  const {
    copyElements,
    runCurrentWorkflow,
    event: workflowEditorEvent,
  } = useWorkflowEditor();

  function deleteNode() {
    deleteElements({ nodes: [{ id: nodeId }] });
  }
  function toggleDisabled() {
    updateNodeData(nodeId, { isDisabled: !nodeData.isDisabled });
  }
  function openContextMenu({ clientX, clientY }: React.MouseEvent) {
    workflowEditorEvent.emit('context-menu:open', {
      nodeId,
      position: { x: clientX, y: clientY },
      type: WorkflowEditorContextMenuType.NODE,
    });
  }

  return (
    <NodeToolbar
      align="start"
      className="bg-background rounded-lg border p-1 flex items-center gap-0.5"
    >
      <NodeToolbarButton
        title={nodeData.isDisabled ? 'Enable' : 'Disable'}
        onClick={toggleDisabled}
      >
        {nodeData.isDisabled ? (
          <ToggleLeftIcon className="h-6 w-6" />
        ) : (
          <ToggleRightIcon className="h-6 w-6 fill-primary stroke-foreground" />
        )}
      </NodeToolbarButton>
      <NodeToolbarButton
        title="Copy node"
        onClick={() => {
          const node = getNode(nodeId) as NodesType.WorkflowNodes;
          if (!node) return;

          copyElements({ nodes: [node] });
        }}
      >
        <CopyIcon size="18px" />
      </NodeToolbarButton>
      <NodeToolbarButton
        title="Run workflow from here"
        onClick={() => runCurrentWorkflow({ startNodeId: nodeId })}
      >
        <PlayIcon size="18px" />
      </NodeToolbarButton>
      <hr className="h-6 block bg-border border-0 w-px mx-1" />
      <NodeToolbarButton title="Delete node" onClick={deleteNode}>
        <TrashIcon className="h-5 w-5" />
      </NodeToolbarButton>
      <NodeToolbarButton title="Open menu" onClick={openContextMenu}>
        <EllipsisIcon className="h-5 w-5" />
      </NodeToolbarButton>
    </NodeToolbar>
  );
}
function NodeCard({
  icon,
  title,
  subtitle,
  children,
  handleSlot,
  isDisabled,
  description,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  subtitle?: string;
  isDisabled: boolean;
  description?: string;
  icon: React.ReactNode;
  handleSlot?: React.ReactNode;
}) {
  return (
    <>
      <div
        className="bg-background min-w-48 rounded-lg border-2 text-sm max-w-52"
        {...props}
        title={title}
      >
        <div className="p-3 flex items-center relative">
          <div className="h-8 w-8 relative">
            {isDisabled && (
              <div className="h-full w-full absolute inline-flex items-center justify-center bg-background opacity-40">
                <BanIcon className="text-destructive" />
              </div>
            )}
            {icon}
          </div>
          <div className="flex-grow ml-2">
            <p
              className={clsx(
                'line-clamp-1',
                isDisabled && 'text-muted-foreground',
              )}
            >
              {title}
            </p>
            <p className="line-clamp-1 text-xs text-muted-foreground">
              {subtitle}
              {isDisabled && ' (disabled)'}
            </p>
          </div>
          {handleSlot}
        </div>
        {children}
      </div>
      <div className="absolute">
        <p className="text-muted-foreground pointer-events-none whitespace-pre-wrap text-xs">
          {description}
        </p>
      </div>
    </>
  );
}

export const WorkflowNodeCommand: React.FC<
  NodeProps<NodesType.WorkflowNodeCommand['data']>
> = memo(({ id, data }) => {
  const { isExtCommandExists } = useWorkflowEditor();
  const [commandExists, setCommandExists] = useState(true);

  useEffect(() => {
    const command = isExtCommandExists(
      `${data.extension.id}:${data.commandId}`,
    );
    command.result.then(setCommandExists).catch(() => {
      // do nothing
    });

    return () => command.cancel();
  }, []);

  return (
    <>
      <NodeToolbarMenu nodeId={id} nodeData={data} />
      <NodeCard
        title={data.title}
        isDisabled={data.isDisabled}
        description={data.description}
        subtitle={data.extension.title}
        icon={
          <UiExtensionIcon
            alt={`${data.title} icon`}
            id={data.extension.id}
            icon={data.icon}
            iconWrapper={(icon) => <UiList.Icon icon={icon} />}
          />
        }
      >
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} id={`default:${id}`} />
        <NodeErrorHandlerHandle
          nodeId={id}
          errorHandlerAction={data.$errorHandler?.action}
        />
        {!commandExists && (
          <UiTooltip
            label={
              <p className="text-xs max-w-64 text-muted-foreground leading-tight">
                Couldn&apos;t find the command. <br /> Make sure the extension
                that include this command is installed.
              </p>
            }
          >
            <TriangleAlertIcon className="absolute h-4 w-4 text-destructive-text top-2 right-2" />
          </UiTooltip>
        )}
      </NodeCard>
    </>
  );
});
WorkflowNodeCommand.displayName = 'WorkflowNodeCommand';

export const WorkflowNodeConditional: React.FC<
  NodeProps<NodesType.WorkflowNodeConditional['data']>
> = memo(({ id, data }) => {
  const updateNodeInternals = useUpdateNodeInternals();

  const nodeData = WORKFLOW_NODES[WORKFLOW_NODE_TYPE.CONDITIONAL];

  useEffect(() => {
    updateNodeInternals(id);
  }, [data.conditions, updateNodeInternals, id]);

  return (
    <>
      <NodeToolbarMenu nodeId={id} nodeData={data} />
      <NodeCard
        title={nodeData.title}
        subtitle={nodeData.subtitle}
        isDisabled={data.isDisabled}
        description={data.description}
        icon={<UiList.Icon icon={nodeData.icon} />}
      >
        <Handle type="target" position={Position.Left} />
        <div className="mb-1.5 flex flex-col items-end gap-1">
          {data.conditions.map((item) => (
            <NodeHandleWithLabel
              key={item.id}
              label={item.name}
              handleId={`condition-${item.id}:${id}`}
              style={{ position: 'relative', bottom: 10, right: -9 }}
              className="text-primary"
            />
          ))}
          <NodeHandleWithLabel
            label="else"
            handleId={`condition-fallback:${id}`}
            title="will execute when no condition is match"
            style={{ position: 'relative', bottom: 10, right: -9 }}
            className="text-orange-500 max-w-48"
          />
        </div>
        <NodeErrorHandlerHandle
          nodeId={id}
          errorHandlerAction={data.$errorHandler?.action}
        />
      </NodeCard>
    </>
  );
});
WorkflowNodeConditional.displayName = 'WorkflowNodeConditional';

export const WorkflowNodeLoop: React.FC<
  NodeProps<NodesType.WorkflowNodeLoop['data']>
> = memo(({ id, data }) => {
  const nodeData = WORKFLOW_NODES[WORKFLOW_NODE_TYPE.LOOP];

  return (
    <>
      <NodeToolbarMenu nodeId={id} nodeData={data} />
      <NodeCard
        title={nodeData.title}
        isDisabled={data.isDisabled}
        subtitle={nodeData.subtitle}
        description={data.description}
        icon={<UiList.Icon icon={nodeData.icon} />}
        handleSlot={
          <>
            <Handle
              type="source"
              position={Position.Right}
              id={`start-loop:${id}`}
              style={{ right: -9 }}
            />
          </>
        }
      >
        <Handle type="target" position={Position.Left} />
        <div className="text-right h-6">
          <NodeHandleWithLabel
            label="loop end"
            handleId={`default:${id}`}
            style={{ position: 'relative', bottom: 10, right: -9 }}
            className="text-orange-500"
          />
        </div>
        <NodeErrorHandlerHandle
          nodeId={id}
          style={{ right: -7 }}
          errorHandlerAction={data.$errorHandler?.action}
        />
      </NodeCard>
    </>
  );
});
WorkflowNodeLoop.displayName = 'WorkflowNodeLoop';

export const WorkflowNodeBasic: React.FC<
  NodeProps<NodesType.WorkflowNodes['data']>
> = memo(({ id, type, data }) => {
  const nodeData = WORKFLOW_NODES[type as WORKFLOW_NODE_TYPE] ||
    WORKFLOW_NODES[data.$nodeType] || {
      handleSource: [],
      handleTarget: [],
      title: 'Invalid node',
      icon: CircleAlertIcon,
    };

  return (
    <>
      <NodeToolbarMenu nodeId={id} nodeData={data} />
      <NodeCard
        title={nodeData.title}
        isDisabled={data?.isDisabled ?? true}
        subtitle={nodeData.subtitle}
        description={data?.description ?? ''}
        icon={<UiList.Icon icon={nodeData.icon} />}
      >
        {nodeData.handleTarget.map((type, index) => (
          <Handle key={type + index} type="target" position={Position.Left} />
        ))}
        {nodeData.handleSource.map((type, index) => (
          <Handle
            key={type + index}
            type="source"
            position={Position.Right}
            id={`default:${id}`}
          />
        ))}
        <NodeErrorHandlerHandle
          nodeId={id}
          errorHandlerAction={data.$errorHandler?.action}
        />
      </NodeCard>
    </>
  );
});
WorkflowNodeBasic.displayName = 'WorkflowNodeBasic';
