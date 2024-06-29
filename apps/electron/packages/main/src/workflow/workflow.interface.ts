import { NewWorkflow, SelectWorkflow } from '../db/schema/workflow.schema';

export type WorkflowDetailModel = SelectWorkflow;

export type WorkflowInsertPayload = Omit<
  NewWorkflow,
  'id' | 'createdAt' | 'updatedAt'
>;

export type WorkflowUpdatePayload = Partial<
  Omit<SelectWorkflow, 'id' | 'createdAt' | 'updatedAt'>
>;

export type WorkflowListItemModel = Pick<
  SelectWorkflow,
  | 'id'
  | 'icon'
  | 'description'
  | 'name'
  | 'isDisabled'
  | 'updatedAt'
  | 'createdAt'
>;
export interface WorkflowListFilter {
  limit?: number;
  isPinned?: boolean;
  sort?: { by: 'executeCount' | 'updatedAt'; asc: boolean };
}

export type WorkflowUpsertPayload = Omit<
  NewWorkflow,
  'createdAt' | 'updatedAt'
>;
