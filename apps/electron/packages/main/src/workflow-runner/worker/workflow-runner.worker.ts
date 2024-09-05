import { BetterMessagePort } from '@altdot/shared';
import { parentPort } from 'process';
import { WorkflowRunnerMessagePort } from '../interfaces/workflow-runner.interface';
import WorkflowRunnerManager from './WorkflowRunnerManager';

type MessageEventListener = (messageEvent: Electron.MessageEvent) => void;
const messagePort: WorkflowRunnerMessagePort = new BetterMessagePort({
  close() {},
  start() {},
  postMessage: (message) => {
    parentPort.postMessage(message);
  },
  removeListener(event, listener) {
    if (event !== 'message') return;
    parentPort.removeListener('message', listener as MessageEventListener);
  },
  addListener(event, listener) {
    if (event !== 'message') return;
    parentPort.addListener('message', listener as MessageEventListener);
  },
} as Electron.MessagePortMain);

WorkflowRunnerManager.instance.setMessagePort(messagePort);

messagePort.async.on('execute-workflow', async (payload) => {
  const runner = await WorkflowRunnerManager.instance.execute(payload);
  return { runnerId: runner.id };
});
