import type { DatabaseWorkflowDetail } from '../../main/src/interface/database.interface';
import type { WorkflowRunPayload } from './workflow.interface';

export type WorkflowRunnerRunPayload = Omit<WorkflowRunPayload, 'id'> & {
  workflow: DatabaseWorkflowDetail;
};

export interface WorkflowRunnerMessagePortEvents {
  'workflow:run': (payload: WorkflowRunnerRunPayload) => string;
}
