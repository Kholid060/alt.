import type { WorkflowRunnerMessagePortAsyncEvents } from '#packages/common/interface/workflow-runner.interace';
import BetterMessagePort from '#packages/common/utils/BetterMessagePort';

function onMessage({ data, ports }: Electron.MessageEvent) {
  if (data !== 'init' || !ports[0]) return;

  process.parentPort.removeListener('message', onMessage);

  const messagePort =
    new BetterMessagePort<WorkflowRunnerMessagePortAsyncEvents>(ports[0]);

  messagePort.async.on('workflow:run', (payload) => {
    return WorkflowRunnerMessagePort.instance.runWorkflow(payload);
  });
}

process.parentPort.addListener('message', onMessage);
