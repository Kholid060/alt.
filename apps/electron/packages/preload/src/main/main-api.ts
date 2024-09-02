import IPCRenderer from '../../../common/utils/IPCRenderer';

export const ipc = {
  on: IPCRenderer.on,
  off: IPCRenderer.off,
  send: IPCRenderer.send,
  invoke: IPCRenderer.invoke,
  invokeWithError: IPCRenderer.invokeWithError,
  handle: IPCRenderer.instance.handle.bind(IPCRenderer.instance),
};

IPCRenderer.on('command-window:extension-port', ({ ports }, runnerId) => {
  window.dispatchEvent(
    new MessageEvent('command-window:extension-port', {
      ports,
      data: runnerId,
    }),
  );
});
