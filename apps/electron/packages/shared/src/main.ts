import IPCRenderer from '#packages/common/utils/IPCRenderer';
import IdleTimer from '#packages/common/utils/IdleTimer';
import './ipc-event-listeners';

IdleTimer.instance.on('idle', () => {
  IPCRenderer.send('window:destroy', 'shared-process');
});
