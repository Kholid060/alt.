import MessagePortService from '../../message-port.service';
import ExtensionWSNamespace from '../ws-namespaces/extensions.ws-namespace';

const onEvent = ExtensionWSNamespace.instance.onSocketEvent.bind(
  ExtensionWSNamespace.instance,
);

onEvent('tabs:active', (tab) => {
  MessagePortService.instance.sendMessage('tabs:active', tab);
});
