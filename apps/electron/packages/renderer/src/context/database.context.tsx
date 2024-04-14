import { createContext, useRef } from 'react';
import EventEmitter from 'eventemitter3';
import { DatabaseQueriesEvent } from '#common/interface/database.interface';

interface DatabaseContextState {
  emitter: EventEmitter<DatabaseQueriesEvent>;
}

// @ts-expect-error don't add default value
export const DatabaseContext = createContext<DatabaseContextState>();

export function DatabaseProvider({ children }: { children?: React.ReactNode }) {
  const emitter = useRef(new EventEmitter<DatabaseQueriesEvent>());

  return (
    <DatabaseContext.Provider value={{ emitter: emitter.current }}>
      {children}
    </DatabaseContext.Provider>
  );
}
