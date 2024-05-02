import { BetterMessagePortAsync } from '@repo/shared';
import type { SandboxEvents } from '../interface/sandbox.interface';

const SandboxMessagePort = (() => {
  const messagePort = new BetterMessagePortAsync<SandboxEvents>((data) =>
    window.top?.postMessage(data, '*'),
  );

  window.addEventListener('message', ({ data }) => {
    messagePort.messageHandler(data);
  });

  return messagePort;
})();

export default SandboxMessagePort;
