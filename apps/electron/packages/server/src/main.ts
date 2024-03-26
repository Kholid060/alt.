import MessagePortService from './service/message-port.service';
import WebsocketService from './service/websocket/websocket.service';

const PORT = 4567;

(() => {
  if (!process.parentPort) {
    throw new Error('Missing process.parentPort');
  }

  process.parentPort.once('message', ({ ports }) => {
    if (ports.length === 0) {
      throw new Error('Missing "MessagePort"');
    }

    MessagePortService.instance.init(ports[0]);
    WebsocketService.instance.initServer(PORT);
  });
})();
