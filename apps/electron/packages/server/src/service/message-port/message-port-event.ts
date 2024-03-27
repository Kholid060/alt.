import ExtensionWSNamespace from '../websocket/ws-namespaces/extensions.ws-namespace';
import MessagePortService from './message-port.service';

export function initMessagePortEventListeners() {
  MessagePortService.instance.onMessage(
    'tabs:reload',
    async ({ browserId, tabId, windowId }) => {
      const [result] = await ExtensionWSNamespace.instance.emitToBrowserWithAck(
        browserId,
        'tabs:reload',
        {
          tabId,
          windowId,
        },
      );

      if (result && result.error) {
        throw new Error(result.errorMessage);
      }
    },
  );
}
