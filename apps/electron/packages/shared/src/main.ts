import IPCRenderer from '#packages/common/utils/IPCRenderer';
import IdleTimer from '#packages/common/utils/IdleTimer';
import { debugLog } from '#packages/common/utils/helper';
import ExtensionCommandRunner from './extension/ExtensionCommandRunner';
import WorkflowRunnerManager from './workflow/WorkflowRunnerManager';

IdleTimer.instance.on('idle', () => {
  IPCRenderer.send('window:destroy', 'shared-process');
});

IPCRenderer.instance.handle('shared-window:execute-command', (payload) => {
  debugLog('Execute command', payload.command.title, payload);
  return ExtensionCommandRunner.instance.execute(payload).then(({ id }) => id);
});
IPCRenderer.instance.handle(
  'shared-window:execute-workflow',
  async (payload) => {
    debugLog(`Execute workflow: "${payload.workflow.name}"`, payload);

    const runner = await WorkflowRunnerManager.instance.execute(payload);
    return runner.id;
  },
);

IPCRenderer.on('shared-window:stop-execute-command', (_, runnerId) => {
  ExtensionCommandRunner.instance.stop(runnerId);
});

IPCRenderer.on('shared-window:stop-execute-workflow', (_, runnerId) => {
  WorkflowRunnerManager.instance.stop(runnerId);
});
