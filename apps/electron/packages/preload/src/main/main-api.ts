import IPCRenderer from '../../../common/utils/IPCRenderer';

export const ipc = {
  on: IPCRenderer.on,
  off: IPCRenderer.off,
  send: IPCRenderer.send,
  invoke: IPCRenderer.invoke,
  invokeWithError: IPCRenderer.invokeWithError,
  handle: IPCRenderer.instance.handle.bind(IPCRenderer.instance),
};

const events = [
  'command-window:open-view',
  'command-window:extension-port',
] as const;
events.forEach((name) => {
  IPCRenderer.on(name, ({ ports }, runnerId) => {
    window.dispatchEvent(
      new MessageEvent(name, {
        ports,
        data: runnerId,
      }),
    );
  });
});
