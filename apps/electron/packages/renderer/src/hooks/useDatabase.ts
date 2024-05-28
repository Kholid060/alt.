import { useCallback, useContext, useEffect, useState } from 'react';
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

export function useDatabase() {
  const databaseCtx = useContext(DatabaseContext);
  if (!databaseCtx) {
    throw new Error(
      'Wrap the component with "DatabaseProvider" before using the hook',
    );
  }

  const queryDatabase = useCallback(
    <T extends keyof DatabaseQueriesEvent>({
      args,
      name,
      onData,
      onError,
      onDBChange,
      autoRefreshOnChange = true,
    }: {
      name: T;
      autoRefreshOnChange?: boolean;
      onError?: (message: string) => void;
      args: Parameters<DatabaseQueriesEvent[T]>;
      onDBChange?: (detail: { refresh: () => void }) => void;
      onData?: (data: ReturnType<DatabaseQueriesEvent[T]>) => void;
    }): (() => void) => {
      const fetchData = () => {
        preloadAPI.main.ipc
          .invoke(name, ...args)
          .then((data) => {
            if (isIPCEventError(data)) {
              onError?.(data.message);
              return;
            }

            onData?.(data);
          })
          .catch((error) => {
            onError?.(error.message);
          });
      };
      const changeListener =
        onDBChange || autoRefreshOnChange
          ? () => {
              if (autoRefreshOnChange) fetchData();
              if (onDBChange) onDBChange({ refresh: fetchData });
            }
          : null;

      fetchData();

      if (changeListener) databaseCtx.emitter.on(name, changeListener);

      return () => {
        if (changeListener) databaseCtx.emitter.off(name, changeListener);
      };
    },
    [databaseCtx.emitter],
  );

  return { ...databaseCtx, queryDatabase };
}

interface UseDatabaseQueryOptions<K, R> {
  transform?: (data: K) => R;
  disableAutoRefresh?: boolean;
}
type UseDatabaseQueryReturn<T> = QueryDBState<T> & {
  refresh(): void;
  updateState(data: T | ((value: T) => T)): void;
};
export function useDatabaseQuery<
  T extends keyof DatabaseQueriesEvent,
  K extends ReturnType<DatabaseQueriesEvent[T]>,
  R = K,
>(
  name: T,
  queryArgs: Parameters<DatabaseQueriesEvent[T]>,
  options?: UseDatabaseQueryOptions<K, R>,
): UseDatabaseQueryReturn<R> {
  const [state, setState] = useState<QueryDBState<R>>({
    data: null,
    error: null,
    state: 'loading',
  });

  const databaseCtx = useDatabase();

  const updateState: UseDatabaseQueryReturn<R>['updateState'] = (data) => {
    if (state.state !== 'idle') {
      throw new Error('DB data can only updated when the state is "idle"');
    }

    // @ts-expect-error it's not expected
    const stateData = typeof data === 'function' ? data(state.data) : data;

    setState({
      error: null,
      state: 'idle',
      data: stateData,
    });
  };

  const fetchQuery = useCallback(() => {
    preloadAPI.main.ipc.invoke(name, ...queryArgs).then((result) => {
      if (isIPCEventError(result)) {
        setState({
          data: null,
          state: 'error',
          error: result.message,
        });
        return;
      }

      const finalResult = options?.transform
        ? options.transform(result as K)
        : result;

      setState({
        error: null,
        state: 'idle',
        data: finalResult as R,
      });
    });
  }, []);

  useEffect(() => {
    fetchQuery();

    const onDataChange = (...args: unknown[]) => {
      if (
        args[0] !== DATABASE_CHANGES_ALL_ARGS &&
        !shallowEqualArrays(args, queryArgs)
      )
        return;

      fetchQuery();
    };
    if (!options?.disableAutoRefresh) {
      databaseCtx.emitter.on(name, onDataChange);
    }

    return () => {
      if (!options?.disableAutoRefresh) {
        databaseCtx.emitter.off(name, onDataChange);
      }
    };
  }, [fetchQuery, databaseCtx.emitter]);

  return { ...state, updateState, refresh: fetchQuery };
}
