import { CommandLaunchContext } from '@repo/extension';
import mitt from 'mitt';

type MittEvent = {
  'execute-command': {
    commandId: string;
    extensionId: string;
    commandTitle: string;
    launchContext: CommandLaunchContext;
  };
};

export type MittEventHandler<T extends keyof MittEvent> = (
  data: MittEvent[T],
) => void;

const emitter = mitt<MittEvent>();

export default emitter;
