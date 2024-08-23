import {
  UiButton,
  UiDialog,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
  UiDropdownMenuTrigger,
  UiIcons,
  UiToggle,
  UiTooltip,
  useDialog,
  useToast,
} from '@altdot/ui';
import {
  ChevronLeftIcon,
  CopyIcon,
  DownloadIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  PinIcon,
  PlayIcon,
  PlusIcon,
  PowerOffIcon,
  TrashIcon,
  VariableIcon,
} from 'lucide-react';
import {
  Link,
  useBlocker,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { useWorkflowEditorStore } from '../../../stores/workflow-editor/workflow-editor.store';
import { useWorkflowEditor } from '/@/hooks/useWorkflowEditor';
import { isIPCEventError } from '#packages/common/utils/helper';
import preloadAPI from '/@/utils/preloadAPI';
import { useCallback, useEffect, useRef, useState } from 'react';
import { nanoid } from 'nanoid/non-secure';
import { WorkflowVariable } from '#packages/common/interface/workflow.interface';
import UiShortcut from '../../ui/UiShortcut';
import { useHotkeys } from 'react-hotkeys-hook';
import DeepLinkURL from '#packages/common/utils/DeepLinkURL';
import WorkflowDetailForm from '../WorkflowDetailForm';
import { WorkflowUpdatePayload } from '#packages/main/src/workflow/workflow.interface';
import { WORKFLOW_NODE_TRIGGERS } from '#packages/common/utils/constant/workflow.const';

function WorkflowInformation() {
  const workflow = useWorkflowEditorStore.use.workflow();
  const updateWorkflow = useWorkflowEditorStore.use.updateWorkflow();

  const [open, setOpen] = useState(false);

  if (!workflow) return <div className="flex-grow"></div>;

  const WorkflowIcon =
    UiIcons[workflow.icon as keyof typeof UiIcons] ?? UiIcons.Workflow;

  return (
    <>
      <div className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-card">
        <WorkflowIcon />
      </div>
      <div className="ml-2 mr-4 flex-grow">
        <div className="flex items-center">
          <h2 className="line-clamp-1 font-semibold">{workflow.name}</h2>
          <PencilIcon
            onClick={() => setOpen(true)}
            className="ml-2 inline h-4 w-4 flex-shrink-0 align-sub text-muted-foreground"
          />
        </div>
        <p className="line-clamp-1 text-xs leading-tight text-muted-foreground">
          {workflow.description}
        </p>
      </div>
      <UiDialog open={open} onOpenChange={setOpen}>
        <UiDialog.Content>
          <UiDialog.Header>
            <UiDialog.Title>Update workflow</UiDialog.Title>
          </UiDialog.Header>
          <WorkflowDetailForm
            defaultValue={{
              name: workflow.name,
              icon: workflow.icon ?? 'Command',
              description: workflow.description ?? '',
            }}
            onSubmit={(value) => {
              updateWorkflow(value);
              setOpen(false);
            }}
          >
            <UiDialog.Footer className="mt-10 gap-2">
              <UiButton
                type="button"
                className="min-w-28"
                variant="secondary"
                onClick={() => setOpen(false)}
              >
                Cancel
              </UiButton>
              <UiButton type="submit" className="min-w-28">
                Update
              </UiButton>
            </UiDialog.Footer>
          </WorkflowDetailForm>
        </UiDialog.Content>
      </UiDialog>
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
          <div className="mt-2 rounded-md border">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="divide-x border-b text-left">
                  <th className="h-12 w-5/12 px-3">Name</th>
                  <th className="h-12 w-5/12 px-3">Value</th>
                  <th className="h-12 w-2/12 px-3">
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
                      className="group/variable divide-x focus-within:bg-secondary/50 hover:bg-secondary/50"
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
                          className="h-full w-full bg-transparent px-3 focus:bg-card focus:outline focus:outline-primary"
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
                          className="h-full w-full bg-transparent px-3 focus:bg-card focus:outline focus:outline-primary"
                          placeholder="variable value"
                        />
                      </td>
                      <td className="h-12 px-3">
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
          <p className="mt-2 text-sm text-muted-foreground">
            You can use a dynamic placeholder as the variable value such as{' '}
            {'{{currentTime}}'}, {'{{date}}'}, {'{{random}}'}, and{' '}
            {'{{clipboard}}'}
          </p>
        </div>
      </UiDialog.Content>
    </UiDialog>
  );
}

function WorkflowSaveButton() {
  const enableWorkflowSaveBtn =
    useWorkflowEditorStore.use.enableWorkflowSaveBtn();

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
    const params = new URLSearchParams(window.location.search);
    params.set('preventCloseWindow', `${enableWorkflowSaveBtn}`);

    setSearchParams(params);
  }, [enableWorkflowSaveBtn]);

  const saveWorkflow = useCallback(async () => {
    try {
      const { workflow, isTriggerChanged } = useWorkflowEditorStore.getState();
      if (!workflow) return;

      const { workflowChanges: changes, clearWorkflowChanges } =
        useWorkflowEditorStore.getState();
      if (changes.size === 0) {
        useWorkflowEditorStore.getState().toggleSaveWorkflowBtn(false);
        return;
      }

      const payload: WorkflowUpdatePayload = {};
      changes.forEach((key) => {
        // @ts-expect-error it's correct type
        payload[key] = workflow[key];
      });

      if (isTriggerChanged) {
        payload.triggers = workflow.nodes.filter(
          (node) => node.type && WORKFLOW_NODE_TRIGGERS.includes(node.type),
        );
      }

      const result = await preloadAPI.main.ipc.invoke(
        'workflow:save',
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

      useWorkflowEditorStore.setState({
        isTriggerChanged: false,
      });
      useWorkflowEditorStore.getState().toggleSaveWorkflowBtn(false);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Something went wrong' });
    }
  }, [toast]);

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
function WorkflowToggles() {
  const workflow = useWorkflowEditorStore.use.workflow();
  const updateWorkflow = useWorkflowEditorStore.use.updateWorkflow();

  if (!workflow) return;

  return (
    <div className="flex h-10 items-center gap-0.5 rounded-md border border-border/60 px-px">
      <UiTooltip
        label={workflow.isDisabled ? 'Enable workflow' : 'Disable workflow'}
      >
        <div>
          <UiToggle
            size="sm"
            className="w-9 p-0 data-[state=on]:text-destructive-text"
            pressed={workflow.isDisabled}
            onPressedChange={(value) =>
              updateWorkflow({ isDisabled: value }, true)
            }
          >
            <PowerOffIcon className="size-5" />
          </UiToggle>
        </div>
      </UiTooltip>
      <UiTooltip label={workflow.isPinned ? 'Unpin workflow' : 'Pin workflow'}>
        <div>
          <UiToggle
            size="sm"
            pressed={workflow.isPinned ?? false}
            className="w-9 p-0"
            onPressedChange={(value) =>
              updateWorkflow({ isPinned: value }, true)
            }
          >
            <PinIcon className="size-5" />
          </UiToggle>
        </div>
      </UiTooltip>
      {/* <UiSwitch
        size="sm"
        checked={!workflow.isDisabled}
        id="workflow-disabled-switch"
        onCheckedChange={(value) => updateWorkflow({ isDisabled: !value })}
      />
      <UiLabel htmlFor="workflow-disabled-switch">Enable</UiLabel> */}
    </div>
  );
}

function WorkflowMoreMenu() {
  const dialog = useDialog();
  const { toast } = useToast();
  const navigate = useNavigate();

  async function exportWorkflow() {
    try {
      const { workflow } = useWorkflowEditorStore.getState();
      if (!workflow) return;

      const result = await preloadAPI.main.ipc.invoke(
        'workflow:export',
        workflow.id,
      );
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
        return;
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong!',
      });
    }
  }
  async function copyDeepLink() {
    try {
      const { workflow } = useWorkflowEditorStore.getState();
      if (!workflow) return;

      const result = await preloadAPI.main.ipc.invoke(
        'clipboard:copy',
        DeepLinkURL.getWorkflow(workflow.id),
      );
      if (isIPCEventError(result)) return;

      toast({
        title: 'Copied to clipboard',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
      });
      console.error(error);
    }
  }
  async function deleteWorkflow() {
    try {
      const { workflow } = useWorkflowEditorStore.getState();
      if (!workflow) return;

      const isConfirmed = await dialog.confirm({
        okText: 'Delete',
        title: 'Delete workflow?',
        okButtonVariant: 'destructive',
        body: 'Are you sure you want to delete this workflow?',
      });
      if (!isConfirmed) return;

      const result = await preloadAPI.main.ipc.invoke(
        'database:delete-workflow',
        workflow.id,
      );
      if (isIPCEventError(result)) {
        toast({
          variant: 'destructive',
          title: 'Something went wrong',
        });
        return;
      }

      navigate('/workflows', { replace: true });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong',
      });
    }
  }

  return (
    <UiDropdownMenu>
      <UiDropdownMenuTrigger asChild>
        <UiButton variant="ghost" size="icon" className="ml-2">
          <EllipsisVerticalIcon className="h-5 w-5" />
        </UiButton>
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent>
        <UiDropdownMenuItem onClick={copyDeepLink}>
          <CopyIcon className="mr-2 h-4 w-4" />
          Copy deep link
        </UiDropdownMenuItem>
        <UiDropdownMenuItem onClick={exportWorkflow}>
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export workflow
        </UiDropdownMenuItem>
        <UiDropdownMenuSeparator />
        <UiDropdownMenuItem onClick={deleteWorkflow} variant="destructive">
          <TrashIcon className="mr-2 h-4 w-4" />
          Delete workflow
        </UiDropdownMenuItem>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  );
}

function WorkflowEditorHeader() {
  const navigate = useNavigate();
  const { runCurrentWorkflow } = useWorkflowEditor();

  useHotkeys('alt+enter', () => runCurrentWorkflow(), []);
  useHotkeys('alt+arrowLeft', () => navigate('/workflows'), []);

  return (
    <header className="flex h-16 items-center border-b px-4">
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
      <hr className="mx-4 h-2/6 w-px bg-border/50" />
      <WorkflowInformation />
      <WorkflowVariableModal />
      <WorkflowMoreMenu />
      <hr className="mx-4 h-2/6 w-px bg-border/50" />
      <WorkflowToggles />
      <hr className="mx-4 h-2/6 w-px bg-border/50" />
      <UiTooltip
        label={
          <>
            Run workflow <UiShortcut shortcut="Alt+Enter" />
          </>
        }
      >
        <UiButton variant="secondary" onClick={() => runCurrentWorkflow()}>
          <PlayIcon className="-ml-0.5 mr-2 h-4 w-4" />
          <p>Run</p>
        </UiButton>
      </UiTooltip>
      <WorkflowSaveButton />
    </header>
  );
}

export default WorkflowEditorHeader;
