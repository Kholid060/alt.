import mitt from 'mitt';

type MittEvent = {
  DO_NOTHING: void;
};

export type MittEventHandler<T extends keyof MittEvent> = (
  data: MittEvent[T],
) => void;

const emitter = mitt<MittEvent>();

export default emitter;
