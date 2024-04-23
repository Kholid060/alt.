import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { WorkflowNodeCommand as WorkflowNodeCommandData } from '/@/interface/workflow.interface';
import { UiList } from '@repo/ui';
import UiExtensionIcon from '../../ui/UiExtensionIcon';

function WorkflowNodeCommand({
  id,
  data,
}: NodeProps<WorkflowNodeCommandData['data']>) {
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
    </div>
  );
}

export default memo(WorkflowNodeCommand);
