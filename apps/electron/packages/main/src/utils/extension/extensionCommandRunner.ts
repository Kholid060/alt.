import WindowsManager from '/@/window/WindowsManager';
import type { ExtensionCommandExecutePayload } from '#packages/common/interface/extension.interface';

async function extensionCommandRunner(payload: ExtensionCommandExecutePayload) {
  WindowsManager.instance.sendMessageToWindow(
    'command',
    'command:execute',
    payload,
  );
}

export default extensionCommandRunner;
