import IPCRenderer from '#packages/common/utils/IPCRenderer';
import ExtensionCommandRunner from './extension/ExtensionCommandRunner';

IPCRenderer.on('command:execute', (_, payload) => {
  ExtensionCommandRunner.instance.execute(payload);
});
