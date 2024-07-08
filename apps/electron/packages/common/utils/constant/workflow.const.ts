import { WORKFLOW_NODE_TYPE } from '@altdot/workflow';

export const WORKFLOW_MANUAL_TRIGGER_ID = '$manual$' as const;

export const WORKFLOW_ELEMENT_FORMAT = 'alt-dot/workflow-elements' as const;

export const WORKFLOW_NODE_TRIGGERS: string[] = [
  WORKFLOW_NODE_TYPE.TRIGGER,
  WORKFLOW_NODE_TYPE.TRIGGER_SHORTCUT,
  WORKFLOW_NODE_TYPE.TRIGGER_EXECUTE_WORKFLOW,
] as const;

export enum WORKFLOW_HISTORY_STATUS {
  Error = 'error',
  Stop = 'stopped',
  Finish = 'finish',
  Running = 'running',
}
