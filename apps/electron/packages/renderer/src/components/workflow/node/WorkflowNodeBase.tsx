import { memo } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';
import { WorkflowNodeCommand } from '/@/interface/workflow.interface';

function WorkflowNodeBase(_props: NodeProps<WorkflowNodeCommand['data']>) {
  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div>
        <label htmlFor="text">Text:</label>
      </div>
      <Handle type="source" position={Position.Right} id="b" />
    </>
  );
}

export default memo(WorkflowNodeBase);
