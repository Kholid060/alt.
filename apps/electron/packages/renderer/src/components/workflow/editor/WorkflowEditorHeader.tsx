import { UiButton, UiDialog, UiTooltip, useToast } from '@repo/ui';
import {
  ChevronLeftIcon,
  PlayIcon,
  PlusIcon,
  RedoIcon,
  TrashIcon,
  UndoIcon,
  VariableIcon,
} from 'lucide-react';
import {
  Link,
  useBlocker,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { UiExtIcon } from '@repo/extension';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { isIPCEventError } from '#packages/common/utils/helper';
import { DatabaseWorkflowUpdatePayload } from '#packages/main/src/interface/database.interface';
import preloadAPI from '/@/utils/preloadAPI';
import { useCallback, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid/non-secure';
import { WorkflowVariable } from '#packages/common/interface/workflow.interface';
import UiShortcut from '../../ui/UiShortcut';
import { useHotkeys } from 'react-hotkeys-hook';
import { useShallow } from 'zustand/react/shallow';

function WorkflowInformation() {
  const workflow = useWorkflowEditorStore.use.workflow();

  if (!workflow) return null;

  const WorkflowIcon =
    UiExtIcon[workflow.icon as keyof typeof UiExtIcon] ?? UiExtIcon.Command;

  return (
    <>
      <div className="inline-flex items-center justify-center h-10 w-10 bg-card rounded-md flex-shrink-0">
        <WorkflowIcon />
      </div>
      <div className="ml-2 flex-grow mr-4">
        <h2 className="font-semibold line-clamp-1">{workflow.name}</h2>
        <p className="text-muted-foreground text-xs leading-tight line-clamp-1">
          {workflow.description}
        </p>
      </div>
    </>
  );
}

function WorkflowVariableModal() {
  const variables = useWorkflowEditorStore(
    (state) => state.workflow?.variables ?? [],
  );
  const updateWorkflow = useWorkflowEditorStore.use.updateWorkflow();

  const prevVariableName = useRef('');

  function addVariable() {
    if (!variables) return;

    const varName = `var_${nanoid(4)}`;
    updateWorkflow({
      variables: [...variables, { id: nanoid(6), name: varName, value: '' }],
    });
  }
  function updateVariable(
    id: string,
    variable: Partial<Pick<WorkflowVariable, 'name' | 'value'>>,
  ) {
    if (Object.hasOwn(variable, 'name')) {
      const usePrevValue =
        !variable.name!.trim() ||
        variables.some((item) => item.id !== id && item.name === variable.name);
      if (usePrevValue) {
        variable.name = prevVariableName.current;

        const variableInputEl = document.getElementById(
          variable.name,
        ) as HTMLInputElement;
        if (variableInputEl) variableInputEl.value = variable.name;

        return;
      }

      prevVariableName.current = '';
    }

    const updatedVariables = variables.map((item) => {
      if (item.id !== id) return item;

      return {
        ...item,
        ...variable,
      };
    });
    updateWorkflow({
      variables: updatedVariables,
    });
  }
  function deleteVariable(id: string) {
    updateWorkflow({
      variables: variables.filter((variable) => variable.id !== id),
    });
  }

  if (!variables) return null;

  return (
    <UiDialog modal>
      <UiTooltip label="Workflow variables">
        <UiDialog.Trigger asChild>
          <UiButton size="icon" variant="ghost">
            <VariableIcon />
          </UiButton>
        </UiDialog.Trigger>
      </UiTooltip>
      <UiDialog.Content className="max-w-2xl p-0">
        <UiDialog.Header className="px-6 pt-6">
          <UiDialog.Title>Workflow variables</UiDialog.Title>
          <UiDialog.Description>
            Create or modifiy variables.
          </UiDialog.Description>
        </UiDialog.Header>
        <div
          style={{ maxHeight: 'calc(100vh - 12rem)' }}
          className="overflow-auto px-6 pb-6"
        >
          <div className="border rounded-md mt-2">
            <table className="table-fixed w-full text-sm">
              <thead>
                <tr className="text-left divide-x border-b">
                  <th className="h-12 px-3 w-5/12">Name</th>
                  <th className="h-12 px-3 w-5/12">Value</th>
                  <th className="h-12 px-3 w-2/12">
                    <UiButton
                      variant="secondary"
                      size="icon-sm"
                      onClick={addVariable}
                    >
                      <PlusIcon className="h-5 w-5" />
                    </UiButton>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {variables.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-3">
                      <p className="text-center text-muted-foreground">
                        No variables data
                      </p>
                    </td>
                  </tr>
                ) : (
                  variables.map((variable) => (
                    <tr
                      key={variable.id}
                      className="divide-x hover:bg-secondary/50 focus-within:bg-secondary/50 group/variable"
                    >
                      <td className="h-12">
                        <input
                          defaultValue={variable.name}
                          id={variable.name}
                          onFocus={() => {
                            prevVariableName.current = variable.name;
                          }}
                          onBlur={({ target }) =>
                            updateVariable(variable.id, { name: target.value })
                          }
                          className="w-full h-full px-3 bg-transparent focus:outline focus:outline-primary focus:bg-card"
                          placeholder="variable name"
                        />
                      </td>
                      <td className="h-12">
                        <input
                          defaultValue={variable.value}
                          onBlur={({ target }) => {
                            updateVariable(variable.id, {
                              value: target.value,
                            });
                          }}
                          className="w-full h-full px-3 bg-transparent focus:outline focus:outline-primary focus:bg-card"
                          placeholder="variable value"
                        />
                      </td>
                      <td className="px-3 h-12">
                        <UiButton
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => deleteVariable(variable.id)}
                          className="invisible group-focus-within/variable:visible group-hover/variable:visible"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </UiButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            You can use a dynamic placeholder as the variable value such as{' '}
            {'{{currentTime}}'}, {'{{date}}'}, {'{{random}}'}, and{' '}
            {'{{clipboard}}'}
          </p>
        </div>
      </UiDialog.Content>
    </UiDialog>
  );
}

function WorkflowUndoRedo() {
  const { undo, redo, historyLen, historyIndex } = useWorkflowEditorStore(
    useShallow((state) => ({
      undo: state.undo,
      redo: state.redo,
      historyLen: state.history.length,
      historyIndex: state.historyIndex,
    })),
  );

  useHotkeys('mod+z', undo, []);
  useHotkeys('mod+shift+z', redo, []);

  return (
    <>
      <UiTooltip
        label={
          <>
            Undo <UiShortcut shortcut="CmdOrCtrl+Z" />
          </>
        }
      >
        <UiButton
          variant="ghost"
          size="icon"
          disabled={historyIndex < 0}
          onClick={undo}
        >
          <UndoIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
      <UiTooltip
        label={
          <>
            Redo <UiShortcut shortcut="CmdOrCtrl+Shift+Z" />
          </>
        }
      >
        <UiButton
          variant="ghost"
          size="icon"
          disabled={historyIndex >= historyLen - 1}
          className="ml-1"
          onClick={redo}
        >
          <RedoIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
    </>
  );
}

function WorkflowSaveButton() {
  const enableWorkflowSaveBtn =
    useWorkflowEditorStore.use.enableWorkflowSaveBtn();
  const toggleSaveWorkflowBtn =
    useWorkflowEditorStore.use.toggleSaveWorkflowBtn();

  const [_searchParams, setSearchParams] = useSearchParams();

  const { toast } = useToast();
  const navigate = useNavigate();

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      enableWorkflowSaveBtn &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const isConfirmed = window.confirm(
        "Exit editor? There some changes haven't been saved",
      );

      if (isConfirmed) blocker.proceed();
      else blocker.reset();
    } else if (blocker.state === 'proceeding') {
      navigate(blocker.location.pathname.replace('/dashboard', ''));
    }

    return () => {
      blocker?.reset?.();
    };
  }, [blocker, navigate]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.append('preventCloseWindow', `${enableWorkflowSaveBtn}`);

    setSearchParams(params);
  }, [enableWorkflowSaveBtn, setSearchParams]);

  const saveWorkflow = useCallback(async () => {
    try {
      const { workflow } = useWorkflowEditorStore.getState();
      if (!workflow) return;

      const { workflowChanges: changes, clearWorkflowChanges } =
        useWorkflowEditorStore.getState();
      if (changes.size === 0) {
        toggleSaveWorkflowBtn(false);
        return;
      }

      const payload: DatabaseWorkflowUpdatePayload = {};
      changes.forEach((key) => {
        //@ts-expect-error ...
        payload[key] = workflow[key];
      });

      const result = await preloadAPI.main.ipc.invoke(
        'database:update-workflow',
        workflow.id,
        payload,
      );
      clearWorkflowChanges();

      if (isIPCEventError(result)) {
        toast({
          title: 'Error',
          variant: 'destructive',
          description: result.message,
        });
        return;
      }

      toggleSaveWorkflowBtn(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Something went wrong' });
    }
  }, []);

  useHotkeys('mod+s', saveWorkflow, []);

  return (
    <UiTooltip
      label={
        <>
          Save workflow <UiShortcut shortcut="CmdOrCtrl+S" />
        </>
      }
    >
      <UiButton
        className="ml-2 min-w-20"
        disabled={!enableWorkflowSaveBtn}
        onClick={saveWorkflow}
      >
        Save
      </UiButton>
    </UiTooltip>
  );
}

function WorkflowEditorHeader() {
  const navigate = useNavigate();
  const { runCurrentWorkflow } = useWorkflowEditor();

  useHotkeys('alt+enter', () => runCurrentWorkflow(), []);
  useHotkeys('alt+arrowLeft', () => navigate('/workflows'), []);

  return (
    <header className="h-20 border-b flex items-center px-4">
      <UiTooltip
        label={
          <>
            Go back <UiShortcut shortcut="Alt+←" />
          </>
        }
      >
        <UiButton
          variant="outline"
          size="icon-sm"
          className="flex-shrink-0"
          asChild
        >
          <Link to="/workflows">
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
        </UiButton>
      </UiTooltip>
      <hr className="h-2/6 bg-border/50 w-px mx-4" />
      <WorkflowInformation />
      <WorkflowUndoRedo />
      <div className="ml-3"></div>
      <WorkflowVariableModal />
      <hr className="h-2/6 bg-border/50 w-px mx-4" />
      <UiTooltip
        label={
          <>
            Run workflow <UiShortcut shortcut="Alt+Enter" />
          </>
        }
      >
        <UiButton variant="secondary" onClick={() => runCurrentWorkflow()}>
          <PlayIcon className="h-4 w-4 mr-2 -ml-0.5" />
          <p>Run</p>
        </UiButton>
      </UiTooltip>
      <WorkflowSaveButton />
    </header>
  );
}

export default WorkflowEditorHeader;
