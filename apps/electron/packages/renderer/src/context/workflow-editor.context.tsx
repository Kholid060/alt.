import { EventEmitter } from 'eventemitter3';
import { createContext, useCallback, useEffect, useRef } from 'react';
import {
  WorkflowEditorEvents,
  XYPosition,
} from '../interface/workflow-editor.interface';
import { createDebounce } from '@altdot/shared';
import preloadAPI from '../utils/preloadAPI';
import { WorkflowNodesContextState } from '@altdot/workflow';
import { SelectExtension } from '#packages/main/src/db/schema/extension.schema';

export interface WorkflowEditorContextState {
  event: EventEmitter<WorkflowEditorEvents>;
  lastMousePos: React.MutableRefObject<XYPosition>;
  isExtCommandExists: WorkflowNodesContextState['extCommandChecker'];
}

export const WorkflowEditorContext = createContext<WorkflowEditorContextState>(
  {} as WorkflowEditorContextState,
);

const extCommandDebounce = createDebounce();

type ExtCommandListenerFunc = (exists: boolean) => void;

interface ExtensionCommandListener {
  extension: Pick<SelectExtension, 'id' | 'isLocal' | 'title'>;
  checkedCommands: Set<string>;
  listeners: Record<string, Set<ExtCommandListenerFunc>>;
}

export function WorkflowEditorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const lastMousePos = useRef<XYPosition>({ x: 0, y: 0 });
  const eventEmitter = useRef(new EventEmitter<WorkflowEditorEvents>());

  const extCommandListeners = useRef<Record<string, ExtensionCommandListener>>(
    {},
  );

  const isExtCommandExists: WorkflowEditorContextState['isExtCommandExists'] =
    useCallback(({ commandName, extension }, listener) => {
      const commandId = `${extension.id}:${commandName}`;

      if (!extCommandListeners.current[extension.id]) {
        extCommandListeners.current[extension.id] = {
          extension,
          listeners: {},
          checkedCommands: new Set(),
        };
      }

      const extensionListener =
        extCommandListeners.current[extension.id].listeners;
      if (!extensionListener[commandId]) {
        extensionListener[commandId] = new Set();
      }

      extensionListener[commandId].add(listener);

      extCommandDebounce(async () => {
        try {
          const commandIds = Object.values(extCommandListeners.current).reduce<
            string[]
          >((acc, curr) => {
            Object.keys(curr.listeners).forEach((key) => {
              if (curr.checkedCommands.has(key)) return;

              acc.push(key);
            });

            return acc;
          }, []);
          if (commandIds.length === 0) return;

          const result = await preloadAPI.main.ipc.invokeWithError(
            'database:extension-command-exists',
            commandIds,
          );
          const missingExtensionIds = new Set<string>();

          Object.values(extCommandListeners.current).forEach((extData) => {
            Object.keys(extData.listeners).forEach((key) => {
              if (extData.checkedCommands.has(key)) return;

              const value = result[key];
              extData.listeners[key].forEach((listener) => {
                listener(value);
              });

              extData.checkedCommands.add(key);

              if (!value && !extData.extension.isLocal) {
                missingExtensionIds.add(extension.id);
              }
            });
          });

          eventEmitter.current.emit('node-command:missing-extension', [
            ...missingExtensionIds,
          ]);
        } catch (error) {
          console.error(error);
        }
      }, 1000);

      return () => {
        extensionListener[commandId]?.delete(listener);
      };
    }, []);

  useEffect(() => {
    const onMousemove = ({ clientX, clientY }: MouseEvent) => {
      lastMousePos.current = { x: clientX, y: clientY };
    };
    window.addEventListener('mousemove', onMousemove);

    const workflowEventEmitter = eventEmitter.current;
    const onNodeCommandExistChange = (
      {
        commandId,
        extensionId,
      }: { extensionId?: string; commandId?: string[] },
      exists: boolean,
    ) => {
      if (commandId) {
        Object.values(extCommandListeners.current).forEach((extData) => {
          commandId.forEach((id) => {
            const listeners = extData.listeners[id];
            if (!listeners) return;

            listeners.forEach((listener) => listener(exists));
          });
        });
        return;
      }

      if (!extensionId) return;

      Object.values(extCommandListeners.current).forEach((extData) => {
        if (extData.extension.id !== extensionId) return;

        Object.values(extData.listeners).forEach((listeners) => {
          listeners.forEach((listener) => {
            listener(exists);
          });
        });
      });
    };
    workflowEventEmitter.addListener(
      'node-command:exists-changed',
      onNodeCommandExistChange,
    );

    return () => {
      window.removeEventListener('mousemove', onMousemove);
      workflowEventEmitter.addListener(
        'node-command:exists-changed',
        onNodeCommandExistChange,
      );
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
