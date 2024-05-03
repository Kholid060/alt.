import { memo, useEffect, useRef } from 'react';
import { Handle, NodeProps, Position, useUpdateNodeInternals } from 'reactflow';
import { WorkflowNodeErroHandlerAction } from '#common/interface/workflow.interface';
import { UiList } from '@repo/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import type * as NodesType from '#packages/common/interface/workflow-nodes.interface';
import { WORKFLOW_NODES } from '/@/utils/constant/workflow-nodes';
import { WORKFLOW_NODE_TYPE } from '#packages/common/utils/constant/constant';
import clsx from 'clsx';

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
      <p className="pl-1 text-muted-foreground">{label}</p>
      <Handle
        type="source"
        id={handleId}
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
function NodeCard({
  icon,
  title,
  subtitle,
  children,
  handleSlot,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  handleSlot?: React.ReactNode;
}) {
  return (
    <div
      className="bg-background min-w-48 rounded-lg border-2 text-sm"
      {...props}
    >
      <div className="p-3 flex items-center relative">
        <div className="h-8 w-8">{icon}</div>
        <div className="flex-grow ml-2">
          <p className="line-clamp-1">{title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {subtitle}
          </p>
        </div>
        {handleSlot}
      </div>
      {children}
    </div>
  );
}

export const WorkflowNodeCommand: React.FC<
  NodeProps<NodesType.WorkflowNodeCommand['data']>
> = memo(({ id, data }) => {
  return (
    <NodeCard
      title={data.title}
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
    </NodeCard>
  );
});
WorkflowNodeCommand.displayName = 'WorkflowNodeCommand';

export const WorkflowNodeLoop: React.FC<
  NodeProps<NodesType.WorkflowNodeLoop['data']>
> = memo(({ id, data }) => {
  const nodeData = WORKFLOW_NODES[WORKFLOW_NODE_TYPE.LOOP];

  return (
    <NodeCard
      title={nodeData.title}
      subtitle={nodeData.subtitle}
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
  );
});
WorkflowNodeLoop.displayName = 'WorkflowNodeLoop';

export const WorkflowNodeBasic: React.FC<
  NodeProps<NodesType.WorkflowNodes['data']>
> = memo(({ id, type, data }) => {
  const nodeData = WORKFLOW_NODES[type as WORKFLOW_NODE_TYPE];

  return (
    <NodeCard
      icon={<UiList.Icon icon={nodeData.icon} />}
      title={nodeData.title}
      subtitle={nodeData.subtitle}
    >
      {nodeData.handleTarget.map((type, index) => (
        <Handle key={type + index} type="target" position={Position.Left} />
      ))}
      {nodeData.handleSource.map((type, index) =>
        type === 'error-fallback' ? (
          <NodeErrorHandlerHandle
            nodeId={id}
            key={type + index}
            errorHandlerAction={data.$errorHandler?.action}
          />
        ) : (
          <Handle
            key={type + index}
            type="source"
            position={Position.Right}
            id={`default:${id}`}
          />
        ),
      )}
    </NodeCard>
  );
});
WorkflowNodeBasic.displayName = 'WorkflowNodeBasic';
