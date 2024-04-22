import { useContext, useEffect, useState } from 'react';
import { shallowEqualArrays } from 'shallow-equal';
import preloadAPI from '../utils/preloadAPI';
import { isIPCEventError } from '../utils/helper';
import { DatabaseContext } from '../context/database.context';
import type { DatabaseQueriesEvent } from '#packages/main/src/interface/database.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';

type QueryDBIdleState<T> = { state: 'idle'; error: null; data: T };
type QueryDBErrorState = { state: 'error'; error: string; data: null };
type QueryDBLoadingState = { state: 'loading'; error: null; data: null };
type QueryDBState<T> =
  | QueryDBIdleState<T>
  | QueryDBErrorState
  | QueryDBLoadingState;

function useDatabaseCtx() {
  const databaseCtx = useContext(DatabaseContext);
  if (!databaseCtx) {
    throw new Error(
      'Wrap the component with "DatabaseProvider" before using the hook',
    );
  }

  return databaseCtx;
}

export function useDatabaseQuery<T extends keyof DatabaseQueriesEvent>(
  name: T,
  args: Parameters<DatabaseQueriesEvent[T]>,
) {
  type ReturnValue = ReturnType<DatabaseQueriesEvent[T]>;

  const [state, setState] = useState<QueryDBState<ReturnValue>>({
    data: null,
    error: null,
    state: 'loading',
  });

  const databaseCtx = useDatabaseCtx();

  function updateState(
    data: ReturnValue | ((prevState: ReturnValue) => ReturnValue),
  ) {
    if (state.state !== 'idle') {
      throw new Error('DB data can only updated when the state is "idle"');
    }

    const stateData = typeof data === 'function' ? data(state.data) : data;

    setState({
      error: null,
      state: 'idle',
      data: stateData,
    });
  }

  useEffect(() => {
    const startQuery = () => {
      preloadAPI.main.invokeIpcMessage(name, ...args).then((result) => {
        if (isIPCEventError(result)) {
          setState({
            data: null,
            state: 'error',
            error: result.message,
          });
          return;
        }

        setState({
          error: null,
          state: 'idle',
          data: result as ReturnType<DatabaseQueriesEvent[T]>,
        });
      });
    };
    startQuery();

    const onDataChange = (...args: unknown[]) => {
      if (
        args[0] !== DATABASE_CHANGES_ALL_ARGS &&
        !shallowEqualArrays(args, args)
      )
        return;

      startQuery();
    };
    databaseCtx.emitter.on(name, onDataChange);

    return () => {
      databaseCtx.emitter.off(name, onDataChange);
    };
  }, [name, databaseCtx.emitter]);

  return { ...state, updateState };
}
