import { memo, useEffect, useRef } from 'react';
import { Handle, NodeProps, Position, useUpdateNodeInternals } from 'reactflow';
import {
  WorkflowNodeCommand as WorkflowNodeCommandData,
  WorkflowNodeErroHandler,
  WorkflowNodeErroHandlerAction,
  WorkflowNodeTrigger as WorkflowNodeTriggerData,
} from '#common/interface/workflow.interface';
import { UiList } from '@repo/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { PlugZapIcon } from 'lucide-react';

function NodeErrorHandlerNode({
  nodeId,
  errorHandler,
}: {
  nodeId: string;
  errorHandler?: WorkflowNodeErroHandler;
}) {
  const updateNodeInternals = useUpdateNodeInternals();
  const prevAction = useRef<WorkflowNodeErroHandlerAction | null>(null);

  useEffect(() => {
    if (!errorHandler?.action || errorHandler.action === prevAction.current) {
      return;
    }

    prevAction.current = errorHandler.action;

    updateNodeInternals(nodeId);
  }, [errorHandler?.action, nodeId, updateNodeInternals]);

  if (errorHandler?.action !== 'fallback') return null;

  return (
    <div className="text-xs inline-flex justify-center bg-background rounded-full items-center custom gap-0.5 border-destructive text-muted-foreground absolute -right-2 border-2 -bottom-2">
      <p className="pl-1">error fallback</p>
      <Handle
        type="source"
        id={`error-fallback:${nodeId}`}
        style={{
          top: 0,
          right: 0,
          width: 16,
          height: 16,
          borderWidth: 2,
          position: 'relative',
          transform: 'translate(0px, 0px)',
          borderColor: 'rgb(var(--background))',
          backgroundColor: 'rgb(var(--destructive))',
        }}
        position={Position.Right}
      ></Handle>
    </div>
  );
}

export const WorkflowNodeCommand: React.FC<
  NodeProps<WorkflowNodeCommandData['data']>
> = memo(({ id, data }) => {
  return (
    <div className="bg-background min-w-48 rounded-lg border-2 text-sm">
      <Handle type="target" position={Position.Left} />
      <div className="p-3 flex items-center">
        <div className="h-8 w-8">
          <UiExtensionIcon
            alt={`${data.title} icon`}
            id={data.extension.id}
            icon={data.icon}
            iconWrapper={(icon) => <UiList.Icon icon={icon} />}
          />
        </div>
        <div className="flex-grow ml-2">
          <p className="line-clamp-1">{data.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {data.extension.title}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id={`default:${id}`} />
      <NodeErrorHandlerNode nodeId={id} errorHandler={data.$errorHandler} />
    </div>
  );
});
WorkflowNodeCommand.displayName = 'WorkflowNodeCommand';

export const WorkflowNodeTrigger: React.FC<
  NodeProps<WorkflowNodeTriggerData['data']>
> = memo(({ id }) => {
  return (
    <div className="bg-background min-w-48 rounded-lg border-2 text-sm rleative">
      <div className="p-3 flex items-center">
        <div className="h-8 w-8">
          <UiList.Icon icon={PlugZapIcon} />
        </div>
        <div className="flex-grow ml-2">
          <p className="line-clamp-1">Manual Trigger</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">Trigger</p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id={`default:${id}`} />
    </div>
  );
});
WorkflowNodeTrigger.displayName = 'WorkflowNodeTrigger';
