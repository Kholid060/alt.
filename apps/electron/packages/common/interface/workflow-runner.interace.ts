import { WorkflowDetailModel } from '../../main/src/workflow/workflow.interface';
import type { WorkflowRunPayload } from './workflow.interface';

export type WorkflowRunnerRunPayload = Omit<WorkflowRunPayload, 'id'> & {
  workflow: WorkflowDetailModel;
};

export interface WorkflowRunnerMessagePortAsyncEvents {
  'workflow:execute': (payload: WorkflowRunnerRunPayload) => string;
}
