import IPCRenderer from '../../../common/utils/IPCRenderer';

export const ipc = {
  on: IPCRenderer.on,
  off: IPCRenderer.off,
  send: IPCRenderer.send,
  invoke: IPCRenderer.invoke,
  invokeWithError: IPCRenderer.invokeWithError,
  handle: IPCRenderer.instance.handle.bind(IPCRenderer.instance),
};

IPCRenderer.on('message-port:created', ({ ports }, { channelId }) => {
  window.dispatchEvent(new MessageEvent(channelId, { ports }));
});
