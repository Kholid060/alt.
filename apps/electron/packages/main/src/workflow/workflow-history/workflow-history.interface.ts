import type { WORKFLOW_NODE_TYPE } from '@altdot/workflow/dist/const/workflow-nodes-type.const';
import {
  NewWorkflowHistory,
  SelectWorkflow,
  SelectWorkflowHistory,
} from '../../db/schema/workflow.schema';

export type WorkflowHistoryModel = SelectWorkflowHistory;

export type WorkflowHistoryWithWorkflowModel = SelectWorkflowHistory & {
  workflow: Pick<SelectWorkflow, 'name' | 'description'>;
};

export interface WorkflowHistoryListPaginationFilter {
  filter?: {
    name?: string;
    workflowId?: string;
  };
  sort?: {
    asc: boolean;
    by: 'startedAt' | 'name' | 'duration';
  };
  pagination?: {
    page: number;
    pageSize: number;
  };
}

export interface WorkflowHistoryListPaginationModel {
  count: number;
  items: WorkflowHistoryWithWorkflowModel[];
}

export type WorkflowHistoryInsertPayload = Omit<NewWorkflowHistory, 'id'>;

export type WorkflowHistoryUpdatePayload = Partial<
  Pick<
    SelectWorkflowHistory,
    | 'duration'
    | 'startedAt'
    | 'runnerId'
    | 'endedAt'
    | 'errorLocation'
    | 'errorMessage'
    | 'status'
  >
>;

export type WorkflowHistoryRunningItemModel = Pick<
  SelectWorkflowHistory,
  'runnerId' | 'startedAt'
> & { workflow: { name: string; icon: string | null } };

export type WorkflowHistoryFindById = number | { runnerId: string };

export interface WorkflowHistoryLogItem {
  id: number;
  msg: string;
  time: string;
  level: number;
  args?: string[];
  node?: { id: string; type: WORKFLOW_NODE_TYPE };
}

export interface WorkflowHistoryRunningWorkflowFilter {
  workflowId?: string;
}
