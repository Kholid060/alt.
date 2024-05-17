import { EventEmitter } from 'eventemitter3';
import { createContext, useCallback, useEffect, useRef } from 'react';
import {
  WorkflowEditorEvents,
  XYPosition,
} from '../interface/workflow-editor.interface';
import { createDebounce } from '@repo/shared';
import preloadAPI from '../utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';

export interface WorkflowEditorContextState {
  event: EventEmitter<WorkflowEditorEvents>;
  lastMousePos: React.MutableRefObject<XYPosition>;
  isExtCommandExists(commandId: string): {
    cancel: () => void;
    result: Promise<boolean>;
  };
}

export const WorkflowEditorContext = createContext<WorkflowEditorContextState>({
  event: new EventEmitter(),
  lastMousePos: { current: { x: 0, y: 0 } },
  isExtCommandExists: () => ({ cancel() {}, result: Promise.resolve(false) }),
});

const extCommandDebounce = createDebounce();

export function WorkflowEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lastMousePos = useRef<XYPosition>({ x: 0, y: 0 });
  const eventEmitter = useRef(new EventEmitter<WorkflowEditorEvents>());

  const extCommandQueue = useRef<
    Record<string, PromiseWithResolvers<boolean>[]>
  >({});

  const isExtCommandExists: WorkflowEditorContextState['isExtCommandExists'] =
    useCallback((commandId: string) => {
      const resolver = Promise.withResolvers<boolean>();

      extCommandDebounce(async () => {
        try {
          const result = await preloadAPI.main.ipc.invoke(
            'database:extension-command-exists',
            Object.keys(extCommandQueue.current),
          );
          if (isIPCEventError(result)) {
            Object.values(extCommandQueue.current)
              .flat()
              .forEach((promise) => {
                promise.reject(new Error(result.message));
              });
            return;
          }

          Object.keys(extCommandQueue.current).forEach((key) => {
            const value = result[key] ?? false;
            extCommandQueue.current[key].forEach((resolver) => {
              resolver.resolve(value);
            });
          });
        } catch (error) {
          console.error(error);
          Object.values(extCommandQueue.current)
            .flat()
            .forEach((resolver) => {
              resolver.reject(new Error('Something went wrong!'));
            });
        } finally {
          extCommandQueue.current = {};
        }
      }, 1000);

      if (!extCommandQueue.current[commandId]) {
        extCommandQueue.current[commandId] = [];
      }
      extCommandQueue.current[commandId].push(resolver);

      return {
        cancel() {
          const index =
            extCommandQueue.current[commandId]?.indexOf(resolver) ?? -1;
          if (index === -1) return;

          resolver.reject(new Error('CANCELED'));
          extCommandQueue.current[commandId].splice(index, 1);
        },
        result: resolver.promise,
      };
    }, []);

  useEffect(() => {
    const onMousemove = ({ clientX, clientY }: MouseEvent) => {
      lastMousePos.current = { x: clientX, y: clientY };
    };
    window.addEventListener('mousemove', onMousemove);

    return () => {
      window.removeEventListener('mousemove', onMousemove);
    };
  }, []);

  return (
    <WorkflowEditorContext.Provider
      value={{
        isExtCommandExists,
        lastMousePos: lastMousePos,
        event: eventEmitter.current,
      }}
    >
      {children}
    </WorkflowEditorContext.Provider>
  );
}
