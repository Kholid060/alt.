import MessagePortService from '../../message-port/message-port.service';
import ExtensionWSNamespace from '../ws-namespaces/extensions.ws-namespace';

ExtensionWSNamespace.instance.onSocketEvent(
  'tabs:active',
  ({ browserInfo }, tab) => {
    MessagePortService.instance.sendMessage(
      'tabs:active',
      { browserId: browserInfo.id },
      tab,
    );
  },
);
