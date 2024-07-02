import { ApiWorkflow } from './api.interface';

export type WebAppWorkflowListItem = Pick<
  ApiWorkflow,
  'id' | 'name' | 'description' | 'icon'
>;
export type WebAppWorkflow = Pick<
  ApiWorkflow,
  'id' | 'name' | 'description' | 'icon' | 'workflow' | 'readme' | 'categories'
>;

export interface WebAppWSClientToServerEvents {
  'workflows:list': () => WebAppWorkflowListItem[];
  'workflows:get': (workflowId: string) => WebAppWorkflow | { notFound: true };
}

export interface WebAppWSServerToClientEvents {}

export interface WebAppWSInterServerEvents {}

export interface WebAppSocketData {}
