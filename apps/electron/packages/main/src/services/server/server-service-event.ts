import type PromiseMessagePort from '#packages/common/utils/PromiseMessagePort';
import type { ServerPortEvent } from '#packages/common/interface/server-port-event.interface';
import WindowsManager from '/@/window/WindowsManager';
import { sendIpcMessageToWindow } from '/@/utils/ipc-main';

export function initServerServiceEventListener(
  messagePort: PromiseMessagePort<ServerPortEvent>,
) {
  const commandWindow = WindowsManager.instance.getWindow('command');
  const sendIpcMessage = sendIpcMessageToWindow(commandWindow);

  messagePort.onMessage('tabs:active', (activeTab) => {
    sendIpcMessage('browser:tabs:active', activeTab);
  });
}
