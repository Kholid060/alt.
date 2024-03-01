import mitt from 'mitt';

type MittEvent = {
  'execute-command': { extensionId: string; commandId: string };
};

export type MittEventHandler<T extends keyof MittEvent> = (
  data: MittEvent[T],
) => void;

const emitter = mitt<MittEvent>();

export default emitter;
