import { ExtensionCommandExecutePayloadWithData } from '#packages/common/interface/extension.interface';
import { ExtensionCommandType } from '@altdot/shared';
import { MessageChannelMain, utilityProcess } from 'electron';

class ExtensionRunnerHost {
  private runningCommands: Map<
    string,
    {
      path: string;
      type: ExtensionCommandType;
      process: Electron.UtilityProcess;
    }
  > = new Map();

  execute(payload: ExtensionCommandExecutePayloadWithData) {
    const commandProcess = utilityProcess.fork(
      './extension-command-action.worker.ts',
    );
    const { port1, port2 } = new MessageChannelMain();
    commandProcess.postMessage({ payload }, [port2]);

    return { port: port1 };
  }
}

export default ExtensionRunnerHost;
