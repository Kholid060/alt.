import { memo, useEffect, useMemo, useRef, useState } from 'react';
import {
  Handle,
  NodeProps,
  NodeResizer,
  NodeToolbar,
  Position,
  useReactFlow,
  useUpdateNodeInternals,
} from '@xyflow/react';
import { UiList, UiTooltip } from '@altdot/ui';
import clsx from 'clsx';
import {
  BanIcon,
  CircleAlertIcon,
  CopyIcon,
  EllipsisIcon,
  PaletteIcon,
  PlayIcon,
  ToggleLeftIcon,
  ToggleRightIcon,
  TrashIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { WORKFLOW_NODES } from '@/const/workflow-nodes.const';
import { WORKFLOW_NODE_TYPE } from '@/const/workflow-nodes-type.const';
import { useWorkflowNodes } from '@/context/workflow-nodes.context';
import {
  WorkflowNodeCommand,
  WorkflowNodeConditional,
  WorkflowNodeErroHandlerAction,
  WorkflowNodeErrorHandler,
  WorkflowNodeLoop,
  WorkflowNodes,
} from '@/interface/workflow-nodes.interface';
import { WorkflowNodeNote } from '../../dist';

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
  errorHandlerAction?: WorkflowNodeErrorHandler['action'];
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
  showRunNode = true,
  showDisableNode = true,
}: {
  nodeId: string;
  showRunNode?: boolean;
  showDisableNode?: boolean;
  nodeData: WorkflowNodes['data'];
}) {
  const nodesCtx = useWorkflowNodes();

  if (nodesCtx.hideToolbar) return null;

  return (
    <NodeToolbar
      align="start"
      className="bg-background rounded-lg border p-1 flex items-center gap-0.5"
    >
      {showDisableNode && (
        <NodeToolbarButton
          title={nodeData.isDisabled ? 'Enable' : 'Disable'}
          onClick={() =>
            nodesCtx.onToggleDisable?.(
              { id: nodeId, data: nodeData },
              !nodeData.isDisabled,
            )
          }
        >
          {nodeData.isDisabled ? (
            <ToggleLeftIcon className="h-6 w-6" />
          ) : (
            <ToggleRightIcon className="h-6 w-6 fill-primary stroke-foreground" />
          )}
        </NodeToolbarButton>
      )}
      <NodeToolbarButton
        title="Copy node"
        onClick={() => {
          nodesCtx.onCopyNode?.([{ id: nodeId, data: nodeData }]);
        }}
      >
        <CopyIcon size="18px" />
      </NodeToolbarButton>
      {showRunNode && (
        <NodeToolbarButton
          title="Run workflow from here"
          onClick={() =>
            nodesCtx.onRunWorkflow?.({ id: nodeId, data: nodeData })
          }
        >
          <PlayIcon size="18px" />
        </NodeToolbarButton>
      )}
      <hr className="h-6 block bg-border border-0 w-px mx-1" />
      <NodeToolbarButton
        title="Delete node"
        onClick={() => nodesCtx.onDeleteNode?.({ id: nodeId, data: nodeData })}
      >
        <TrashIcon className="h-5 w-5" />
      </NodeToolbarButton>
      <NodeToolbarButton
        title="Open menu"
        onClick={(event) =>
          nodesCtx.onOpenContextMenu?.({ id: nodeId, data: nodeData }, event)
        }
      >
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

export const WorkflowNodeCommandNode: React.FC<NodeProps<WorkflowNodeCommand>> =
  memo(({ id, data }) => {
    const { extCommandChecker, resolveExtIcon } = useWorkflowNodes();

    const [commandExists, setCommandExists] = useState(true);

    const extensionIcon = useMemo(() => resolveExtIcon({ id, data }), []);

    useEffect(() => {
      const command = extCommandChecker(
        `${data.extension.id}:${data.commandId}`,
      );
      command.result.then(setCommandExists).catch(() => {
        // do nothing
      });

      return () => command.cancel();
    }, [data.commandId, data.extension.id, extCommandChecker]);

    return (
      <>
        <NodeToolbarMenu nodeId={id} nodeData={data} />
        <NodeCard
          title={data.title}
          isDisabled={data.isDisabled}
          description={data.description}
          subtitle={data.extension.title}
          icon={extensionIcon}
        >
          <Handle type="target" position={Position.Left} />
          <Handle
            type="source"
            position={Position.Right}
            id={`default:${id}`}
          />
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
WorkflowNodeCommandNode.displayName = 'WorkflowNodeCommand';

export const WorkflowNodeConditionalNode: React.FC<
  NodeProps<WorkflowNodeConditional>
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
WorkflowNodeConditionalNode.displayName = 'WorkflowNodeConditional';

export const WorkflowNodeLoopNode: React.FC<NodeProps<WorkflowNodeLoop>> = memo(
  ({ id, data }) => {
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
  },
);
WorkflowNodeLoopNode.displayName = 'WorkflowNodeLoop';

export const WorkflowNodeBasicNode: React.FC<NodeProps<WorkflowNodes>> = memo(
  ({ id, type, data }) => {
    const nodeData = WORKFLOW_NODES[type as WORKFLOW_NODE_TYPE] ||
      WORKFLOW_NODES[data.$nodeType as WORKFLOW_NODE_TYPE] || {
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
  },
);
WorkflowNodeBasicNode.displayName = 'WorkflowNodeBasic';

const NOTE_COLORS = [
  'rgb(var(--background))',
  '#6e56cf',
  '#0090ff',
  '#12a594',
  '#f76b15',
  '#e54666',
];

// wat 🤯
export const WorkflowNodeNoteNode: React.FC<NodeProps<WorkflowNodeNote>> = memo(
  ({ id, data, selected }) => {
    const nodeData = WORKFLOW_NODES[WORKFLOW_NODE_TYPE.NOTE];
    const { updateNodeData } = useReactFlow();

    return (
      <>
        <NodeResizer minWidth={160} minHeight={160} isVisible={selected} />
        <NodeToolbarMenu
          nodeId={id}
          nodeData={data}
          showRunNode={false}
          showDisableNode={false}
        />
        <div
          className="bg-background h-full w-full rounded-lg border-2 text-sm min-h-40 min-w-40 flex flex-col"
          style={{ backgroundColor: data.color }}
        >
          <div className="flex items-center p-2 border-b border-black/25 text-xs relative">
            <nodeData.icon className="size-4" />
            <p className="ml-1 flex-1">Note</p>
            <div
              style={{ backgroundColor: data.color }}
              className="size-5 rounded-full border group flex items-center justify-center"
            >
              <PaletteIcon className="size-3 opacity-80" />
              <div
                style={{ backgroundColor: data.color }}
                className="absolute group-hover:flex hidden h-full w-full items-center top-0 left-0 gap-1 justify-end rounded-t-lg px-2"
              >
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color}
                    style={{ backgroundColor: color }}
                    className="size-5 rounded-full border block"
                    onClick={() => updateNodeData(id, { color })}
                  ></button>
                ))}
              </div>
            </div>
          </div>
          <textarea
            style={{ resize: 'none' }}
            defaultValue={data.content}
            placeholder="Write a note here..."
            className="flex-1 w-full p-2 focus:outline-none rounded-b-lg bg-transparent"
            onChange={(event) =>
              updateNodeData(id, { content: event.target.value })
            }
          ></textarea>
        </div>
      </>
    );
  },
);
WorkflowNodeNoteNode.displayName = 'WorkflowNodeNote';
