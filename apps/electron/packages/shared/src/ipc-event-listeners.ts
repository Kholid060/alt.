import { debugLog } from '#packages/common/utils/helper';
import IPCRenderer from '#packages/common/utils/IPCRenderer';
import ExtensionCommandRunner from './extension/ExtensionCommandRunner';

IPCRenderer.instance.handle(
  'shared-window:execute-command',
  async (payload) => {
    debugLog('Execute command', payload.command.title, payload);
    return ExtensionCommandRunner.instance.execute(payload);
  },
);

IPCRenderer.on('shared-window:stop-execute-command', (_, processId) => {
  ExtensionCommandRunner.instance.stop(processId);
});
