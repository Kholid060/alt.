import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import {
  WorkflowNodeCommand as WorkflowNodeCommandData,
  WorkflowNodeTrigger as WorkflowNodeTriggerData,
} from '#common/interface/workflow.interface';
import { UiList } from '@repo/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { PlugZapIcon } from 'lucide-react';

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
            id={data.extensionId}
            icon={data.icon}
            iconWrapper={(icon) => <UiList.Icon icon={icon} />}
          />
        </div>
        <div className="flex-grow ml-2">
          <p className="line-clamp-1">{data.title}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {data.extensionTitle}
          </p>
        </div>
      </div>
      <Handle type="source" position={Position.Right} id={`${id}--handle`} />
      {/* <Handle
        type="source"
        position={Position.Right}
        id={`${id}--handle-2`}
        className="text-xs inline-flex justify-center items-center px-1 custom gap-1 text-muted-foreground"
        style={{
          top: '100%',
          borderColor: 'rgb(var(--destructive))',
        }}
      >
        <p>on error</p>
        <div className="dot bg-destructive"></div>
      </Handle> */}
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
      <Handle type="source" position={Position.Right} id={`${id}--handle`} />
    </div>
  );
});
WorkflowNodeTrigger.displayName = 'WorkflowNodeTrigger';
