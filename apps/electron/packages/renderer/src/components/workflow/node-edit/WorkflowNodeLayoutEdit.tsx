import {
  UiList,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
  UiBadge,
  UiTooltip,
} from '@repo/ui';
import WorkflowNodeSettings from './WorkflowNodeSettings';
import { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';
import { WORKFLOW_NODES } from '#common/utils/constant/workflow-nodes.const';
import { useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';

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
          <UiTabsTrigger value="settings">Settings</UiTabsTrigger>
          {tabsSlot}
        </UiTabsList>
        <UiTabsContent value="parameters" className="p-4 mt-0">
          {children}
        </UiTabsContent>
        <UiTabsContent value="settings" className="p-4 mt-0">
          <WorkflowNodeSettings data={node.data} />
        </UiTabsContent>
        {tabContentSlot}
      </UiTabs>
    </>
  );
}

export default WorkflowNodeLayoutEdit;
