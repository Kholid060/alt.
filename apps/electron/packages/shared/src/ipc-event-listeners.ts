import { debugLog } from '#packages/common/utils/helper';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import ExtensionCommandRunner from './extension/ExtensionCommandRunner';
import WorkflowRunnerManager from './workflow/WorkflowRunnerManager';

IPCRenderer.instance.handle('shared-window:execute-command', (payload) => {
  debugLog('Execute command', payload.command.title, payload);
  return ExtensionCommandRunner.instance.execute(payload).then(({ id }) => id);
});
IPCRenderer.instance.handle('shared-window:execute-workflow', (payload) => {
  debugLog(`Execute workflow: "${payload.workflow.name}"`, payload);
  return WorkflowRunnerManager.instance
    .execute(payload)
    .then((runner) => runner.id);
});

IPCRenderer.on('shared-window:stop-execute-command', (_, runnerId) => {
  ExtensionCommandRunner.instance.stop(runnerId);
});
