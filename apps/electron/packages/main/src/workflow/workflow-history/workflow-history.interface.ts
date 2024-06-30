import {
  NewWorkflowHistory,
  SelectWorkflow,
  SelectWorkflowHistory,
} from '../../db/schema/workflow.schema';

export type WorkflowHistoryModel = SelectWorkflowHistory & {
  workflow: Pick<SelectWorkflow, 'name' | 'description'>;
};

export interface WorkflowHistoryListPaginationFilter {
  filter?: {
    name?: string;
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
  items: WorkflowHistoryModel[];
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
