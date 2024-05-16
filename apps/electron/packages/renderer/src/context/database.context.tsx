import { createContext, useEffect, useRef } from 'react';
import EventEmitter from 'eventemitter3';
import preloadAPI from '../utils/preloadAPI';
import { DatabaseQueriesEvent } from '#packages/main/src/interface/database.interface';
export interface DatabaseContextState {
  emitter: EventEmitter<DatabaseQueriesEvent>;
}

// @ts-expect-error don't add default value
export const DatabaseContext = createContext<DatabaseContextState>();

export function DatabaseProvider({ children }: { children?: React.ReactNode }) {
  const emitter = useRef(new EventEmitter<DatabaseQueriesEvent>());

  useEffect(() => {
    const offDbChanges = preloadAPI.main.ipc.on(
      'database:changes',
      (_, changes) => {
        console.log(changes);
        for (const key in changes) {
          emitter.current.emit(
            key as keyof DatabaseQueriesEvent,
            // @ts-expect-error .-.
            ...changes[key],
          );
        }
      },
    );

    return () => {
      offDbChanges?.();
    };
  }, []);

  return (
    <DatabaseContext.Provider value={{ emitter: emitter.current }}>
      {children}
    </DatabaseContext.Provider>
  );
}
