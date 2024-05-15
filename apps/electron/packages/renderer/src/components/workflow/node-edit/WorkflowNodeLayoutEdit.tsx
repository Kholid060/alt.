import {
  UiList,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
  UiBadge,
  UiTooltip,
} from '@repo/ui';
import WorkflowNodeErrorHandler from './WorklflowNodeErrorHandler';
import { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';
import { WORKFLOW_NODES } from '/@/utils/constant/workflow-nodes';
import { useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';

interface WorkflowNodeLayoutEditProps {
  title?: string;
  subtitle?: string;
  node: WorkflowNodes;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

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
    <UiTooltip label={copied ? '✅ Copied' : 'Node id (click to copy)'}>
      <button onClick={copyNodeId}>
        <UiBadge variant="secondary" className="max-w-20 flex-shrink-0">
          <span className="line-clamp-1">{nodeId} _</span>
        </UiBadge>
      </button>
    </UiTooltip>
  );
}

function WorkflowNodeLayoutEdit({
  node,
  icon,
  title,
  subtitle,
  children,
}: WorkflowNodeLayoutEditProps) {
  const nodeData = WORKFLOW_NODES[node.type];

  return (
    <>
      <div className="p-4 pb-2 flex items-center gap-2">
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
        <UiTabsList className="sticky top-0 bg-background z-50">
          <UiTabsTrigger value="parameters">Parameters</UiTabsTrigger>
          <UiTabsTrigger value="error">Error Handler</UiTabsTrigger>
        </UiTabsList>
        <UiTabsContent value="parameters" className="p-4 mt-0">
          {children}
        </UiTabsContent>
        <UiTabsContent value="error" className="p-4 mt-0">
          <WorkflowNodeErrorHandler data={node.data.$errorHandler} />
        </UiTabsContent>
      </UiTabs>
    </>
  );
}

export default WorkflowNodeLayoutEdit;
