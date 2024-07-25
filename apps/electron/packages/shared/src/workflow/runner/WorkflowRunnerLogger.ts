import { Level, Logger, pino } from 'pino';
import WorkflowRunner from './WorkflowRunner';
import path from 'path';
import { WorkflowNodes } from '@altdot/workflow';

class WorkflowRunnerLogger {
  readonly instance: Logger;

  constructor(
    private readonly runner: WorkflowRunner,
    private readonly logDir: string,
  ) {
    let id = 0;
    this.instance = pino(
      {
        formatters: {
          bindings: () => ({}),
          level(label) {
            return { level: label };
          },
        },
        mixin() {
          return { id: ++id };
        },
        timestamp: () => {
          const date = new Date();
          const hour = date.getHours().toString().padStart(2, '0');
          const minute = date.getMinutes().toString().padStart(2, '0');
          const second = date.getSeconds().toString().padStart(2, '0');
          const millisecond = date
            .getMilliseconds()
            .toString()
            .padStart(3, '0');

          return `,"time":"${hour}:${minute}:${second}.${millisecond}"`;
        },
      },
      pino.destination(path.join(this.logDir, `${this.runner.id}.log`)),
    );
  }

  logNode(
    level: Level,
    { id, type }: WorkflowNodes,
    message: string,
    additionalProps: Record<PropertyKey, unknown> = {},
  ) {
    this.instance[level]({ node: { id, type }, ...additionalProps }, message);
  }
}

export default WorkflowRunnerLogger;
