import { ExtensionDataBase } from '#common/interface/extension.interface';
import { CommandLaunchContext } from '@repo/extension';
import { ExtensionCommand } from '@repo/extension-core';
import mitt from 'mitt';

type MittEvent = {
  'execute-command': {
    commandIcon: string;
    command: ExtensionCommand;
    extension: ExtensionDataBase;
    launchContext: CommandLaunchContext;
  };
};

export type MittEventHandler<T extends keyof MittEvent> = (
  data: MittEvent[T],
) => void;

const emitter = mitt<MittEvent>();

export default emitter;
