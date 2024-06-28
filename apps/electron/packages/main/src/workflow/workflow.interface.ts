import { NewWorkflow, SelectWorkflow } from '../db/schema/workflow.schema';

export type WorkflowDetailModel = SelectWorkflow;

export type WorkflowInsertPayload = Omit<
  NewWorkflow,
  'id' | 'createdAt' | 'updatedAt'
>;
