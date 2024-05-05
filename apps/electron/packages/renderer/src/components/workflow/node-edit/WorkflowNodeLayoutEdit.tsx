import {
  UiList,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
  UiTabsContent,
} from '@repo/ui';
import WorkflowNodeErrorHandler from './WorklflowNodeErrorHandler';
import { WorkflowNodes } from '#packages/common/interface/workflow-nodes.interface';
import { WORKFLOW_NODES } from '/@/utils/constant/workflow-nodes';

interface WorkflowNodeLayoutEditProps {
  title?: string;
  subtitle?: string;
  node: WorkflowNodes;
  icon?: React.ReactNode;
  children?: React.ReactNode;
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
      </div>
      <UiTabs variant="line" defaultValue="parameters">
        <UiTabsList>
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
