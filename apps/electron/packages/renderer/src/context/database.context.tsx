import { createContext, useEffect, useRef } from 'react';
import EventEmitter from 'eventemitter3';
import { DatabaseQueriesEvent } from '#common/interface/database.interface';
import preloadAPI from '../utils/preloadAPI';

interface DatabaseContextState {
  emitter: EventEmitter<DatabaseQueriesEvent>;
}

// @ts-expect-error don't add default value
export const DatabaseContext = createContext<DatabaseContextState>();

export function DatabaseProvider({ children }: { children?: React.ReactNode }) {
  const emitter = useRef(new EventEmitter<DatabaseQueriesEvent>());

  useEffect(() => {
    const offDbChanges = preloadAPI.main.ipcMessage.on(
      'database:changes',
      (_, type, ...args) => {
        // @ts-expect-error something
        emitter.current.emit(type, ...args);
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
