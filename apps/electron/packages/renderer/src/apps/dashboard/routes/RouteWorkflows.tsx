import { DatabaseUpdateEvents } from '#packages/main/src/interface/database.interface';
import {
  ArrowDownAzIcon,
  ArrowUpAzIcon,
  EllipsisVerticalIcon,
  LucideProps,
  PinIcon,
  PinOffIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import UiStateView from '/@/components/ui/UiStateView';
import {
  UiAlertDialog,
  UiAlertDialogAction,
  UiAlertDialogCancel,
  UiAlertDialogContent,
  UiAlertDialogDescription,
  UiAlertDialogFooter,
  UiAlertDialogHeader,
  UiAlertDialogTitle,
  UiButton,
  UiCard,
  UiCardContent,
  UiCardFooter,
  UiCardHeader,
  UiDialog,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
  UiDropdownMenuTrigger,
  UiInput,
  UiSelect,
  UiSwitch,
  UiTooltip,
  useToast,
} from '@alt-dot/ui';
import { UiExtIcon } from '@alt-dot/extension';
import { useCallback, useEffect, useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '/@/utils/helper';
import { arrayObjSorter } from '#packages/common/utils/helper';
import { LOCALSTORAGE_KEYS } from '../../../utils/constant/constant';
import { parseJSON } from '@alt-dot/shared';
import dayjs from '/@/lib/dayjs';
import clsx from 'clsx';
import { Link, useNavigate } from 'react-router-dom';
import DeepLinkURL from '#packages/common/utils/DeepLinkURL';
import { WORKFLOW_MANUAL_TRIGGER_ID } from '#packages/common/utils/constant/workflow.const';
import WorkflowDetailForm, {
  NewWorkflowSchema,
} from '/@/components/workflow/WorkflowDetailForm';
import { WorkflowListItemModel } from '#packages/main/src/workflow/workflow.interface';

type IconsName = keyof typeof UiExtIcon;

function WorkflowIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Icon = UiExtIcon[icon as IconsName] ?? UiExtIcon.Command;

  return <Icon {...props} />;
}
function WorkflowCards({ workflows }: { workflows: WorkflowListItemModel[] }) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [deleteDialog, setDeleteDialog] = useState<null | {
    id: string;
    name: string;
  }>(null);

  const updateWorkflow: DatabaseUpdateEvents['database:update-workflow'] =
    async (...args) => {
      try {
        const result = await preloadAPI.main.ipc.invoke(
          'database:update-workflow',
          ...args,
        );
        if (isIPCEventError(result)) {
          toast({
            title: 'error',
            description: result.message,
          });
          return;
        }
      } catch (error) {
        console.error(error);
        toast({
          title: 'Something went wrong',
        });
      }
    };
  async function deleteWorkflow() {
    try {
      if (!deleteDialog) return;

      const result = await preloadAPI.main.ipc.invoke(
        'database:delete-workflow',
        deleteDialog.id,
      );
      if (isIPCEventError(result)) {
        toast({
          title: 'error',
          description: result.message,
        });
        return;
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Something went wrong',
      });
    }
  }
  async function exportWorkflow(workflowId: string) {
    try {
      const result = await preloadAPI.main.ipc.invoke(
        'workflow:export',
        workflowId,
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
  async function copyDeepLink(workflowId: string) {
    try {
      const result = await preloadAPI.main.ipc.invoke(
        'clipboard:copy',
        DeepLinkURL.getWorkflow(workflowId),
      );
      if (isIPCEventError(result)) return;

      toast({
        title: 'Copied to clipboard',
      });
    } catch (error) {
      console.error(error);
    }
  }

  if (workflows.length === 0) {
    return (
      <UiStateView
        type="empty"
        className="mt-24"
        title="You don't have any workflows"
        description='Click the "new" button to create a new workflow '
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 2xl:grid-cols-4">
      {workflows.map((workflow) => (
        <UiCard
          key={workflow.id}
          className={clsx(
            'flex flex-col cursor-default',
            workflow.isDisabled && 'opacity-80 text-muted-foreground',
          )}
        >
          <UiCardHeader className="p-4 flex-row items-center pb-2">
            <div className="h-10 w-10 border border-border/50 rounded-md bg-background/50 inline-flex justify-center items-center">
              <WorkflowIcon icon={workflow.icon ?? ''} className="h-5 w-5" />
            </div>
            <div className="flex-grow"></div>
            <UiTooltip
              label={workflow.isPinned ? 'Unpin workflow' : 'Pin workflow'}
            >
              <UiButton
                size="icon-sm"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() =>
                  updateWorkflow(workflow.id, { isPinned: !workflow.isPinned })
                }
              >
                {workflow.isPinned ? (
                  <PinIcon className="size-5 fill-inherit" />
                ) : (
                  <PinOffIcon className="size-5 " />
                )}
              </UiButton>
            </UiTooltip>
          </UiCardHeader>
          <Link to={`/workflows/${workflow.id}`} className="flex-grow">
            <UiCardContent
              className={clsx(
                'px-4 flex-grow flex items-start gap-2',
                !workflow.description && 'items-center',
              )}
            >
              <div className="flex-grow">
                <p className="line-clamp-2">{workflow.name}</p>
                <p className="line-clamp-2 text-muted-foreground text-sm leading-tight">
                  {workflow.description}
                </p>
              </div>
            </UiCardContent>
          </Link>
          <UiCardFooter className="px-4 pb-4 gap-2">
            <p className="text-sm text-muted-foreground flex-grow line-clamp-1">
              Updated {dayjs(new Date(workflow.updatedAt)).fromNow()}
            </p>
            <UiSwitch
              checked={!workflow.isDisabled}
              size="sm"
              onCheckedChange={() =>
                updateWorkflow(workflow.id, {
                  isDisabled: !workflow.isDisabled,
                })
              }
            />
            <UiDropdownMenu>
              <UiDropdownMenuTrigger>
                <EllipsisVerticalIcon className="h-5 w-5" />
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent>
                <UiDropdownMenuItem
                  onClick={() =>
                    preloadAPI.main.ipc.invoke('workflow:execute', {
                      id: workflow.id,
                      startNodeId: WORKFLOW_MANUAL_TRIGGER_ID,
                    })
                  }
                >
                  Run
                </UiDropdownMenuItem>
                <UiDropdownMenuItem
                  onClick={() => navigate(`/workflows/${workflow.id}`)}
                >
                  Edit
                </UiDropdownMenuItem>
                <UiDropdownMenuItem onClick={() => exportWorkflow(workflow.id)}>
                  Export
                </UiDropdownMenuItem>
                <UiDropdownMenuItem onClick={() => copyDeepLink(workflow.id)}>
                  Copy deep link
                </UiDropdownMenuItem>
                <UiDropdownMenuSeparator />
                <UiDropdownMenuItem
                  onClick={() =>
                    setDeleteDialog({ id: workflow.id, name: workflow.name })
                  }
                  className="text-destructive-text data-[highlighted]:text-destructive-text data-[highlighted]:bg-destructive/20"
                >
                  Delete
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </UiCardFooter>
        </UiCard>
      ))}
      <UiAlertDialog
        open={Boolean(deleteDialog)}
        onOpenChange={(value) => !value && setDeleteDialog(null)}
      >
        <UiAlertDialogContent>
          <UiAlertDialogHeader>
            <UiAlertDialogTitle>Delete workflow?</UiAlertDialogTitle>
            <UiAlertDialogDescription>
              This action cannot be undone. Are you sure want to delete the
              &ldquo;<b>{deleteDialog?.name}</b>
              &ldquo; workflow?
            </UiAlertDialogDescription>
            <UiAlertDialogFooter>
              <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
              <UiAlertDialogAction
                variant="destructive"
                onClick={deleteWorkflow}
              >
                Delete
              </UiAlertDialogAction>
            </UiAlertDialogFooter>
          </UiAlertDialogHeader>
        </UiAlertDialogContent>
      </UiAlertDialog>
    </div>
  );
}

function WorkflowCreateDialog() {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);

  async function createNewWorkflow(values: NewWorkflowSchema) {
    try {
      const workflowId = await preloadAPI.main.ipc.invoke(
        'database:insert-workflow',
        values,
      );
      if (isIPCEventError(workflowId)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: workflowId.message,
        });
        return;
      }

      setOpen(false);
      navigate(`/workflows/${workflowId}`);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <UiDialog open={open} onOpenChange={setOpen}>
      <UiDialog.Trigger asChild>
        <UiButton className="w-24">
          <PlusIcon className="mr-2 -ml-1 h-5 w-5" />
          New
        </UiButton>
      </UiDialog.Trigger>
      <UiDialog.Content>
        <UiDialog.Header>
          <UiDialog.Title>New workflow</UiDialog.Title>
          <UiDialog.Description>Create a new workflow</UiDialog.Description>
        </UiDialog.Header>
        <WorkflowDetailForm onSubmit={createNewWorkflow}>
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
              Create
            </UiButton>
          </UiDialog.Footer>
        </WorkflowDetailForm>
      </UiDialog.Content>
    </UiDialog>
  );
}

type WorkflowSortBy = 'name' | 'updatedAt' | 'createdAt';
type WorkflowSort = { asc: boolean; by: WorkflowSortBy };
function RouteWorkflows() {
  const workflowsQuery = useDatabaseQuery('database:get-workflow-list', [
    { sort: { by: 'isPinned', asc: true } },
  ]);

  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<WorkflowSort>(() => {
    const savedSort = parseJSON<WorkflowSort, null>(
      localStorage.getItem(LOCALSTORAGE_KEYS.workflowListSort) ?? '',
      null,
    );

    if (
      savedSort &&
      Object.hasOwn(savedSort, 'asc') &&
      Object.hasOwn(savedSort, 'by')
    )
      return savedSort;

    return {
      asc: false,
      by: 'createdAt',
    };
  });

  const filteredWorkflows = arrayObjSorter({
    data:
      workflowsQuery.data?.filter((workflow) =>
        workflow.name.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    key: sort.by,
    getItem(item) {
      if (sort.by === 'name') return item.name.toLowerCase();

      return item[sort.by];
    },
    order: sort.asc ? 'asc' : 'desc',
  });

  const importWorkflow = useCallback(
    async (filePaths?: string[]) => {
      try {
        const result = await preloadAPI.main.ipc.invoke(
          'workflow:import',
          filePaths,
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
    },
    [toast],
  );

  useEffect(() => {
    localStorage.setItem(
      LOCALSTORAGE_KEYS.workflowListSort,
      JSON.stringify(sort),
    );
  }, [sort]);
  useEffect(() => {
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
    };
    const onDrop = (event: DragEvent) => {
      event.preventDefault();
      const files: File[] = Array.from(event.dataTransfer?.files ?? []).filter(
        (file) => file.name.endsWith('.json'),
      );
      if (files.length === 0) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: 'Invalid workflow file',
        });
        return;
      }

      importWorkflow(files.map((file) => file.path));
    };

    document.addEventListener('drop', onDrop);
    document.addEventListener('dragover', onDragOver);

    return () => {
      document.removeEventListener('drop', onDrop);
      document.removeEventListener('dragover', onDragOver);
    };
  }, [importWorkflow, toast]);

  return (
    <div className="p-8 container">
      <h2 className="text-2xl font-semibold leading-tight -mt-0.5">
        Workflows
      </h2>
      <div className="flex items-center mt-8">
        <UiInput
          value={search}
          placeholder="Search workflows..."
          prefixIcon={<SearchIcon className="h-5 w-5" />}
          onValueChange={setSearch}
        />
        <div className="flex items-center ml-4 rounded-md border text-sm">
          <UiButton
            variant="outline"
            size="icon"
            className="flex-shrink-0 border-0"
            onClick={() =>
              setSort((prevVal) => ({ ...prevVal, asc: !prevVal.asc }))
            }
          >
            {sort.asc ? (
              <ArrowDownAzIcon className="h-5 w-5" />
            ) : (
              <ArrowUpAzIcon className="h-5 w-5" />
            )}
          </UiButton>
          <hr className="h-6 w-px bg-border" />
          <UiSelect
            value={sort.by}
            className="border-0 bg-background px-2"
            placeholder="Sort by"
            onValueChange={(value) =>
              setSort((prevValue) => ({
                ...prevValue,
                by: value as WorkflowSortBy,
              }))
            }
          >
            <UiSelect.Option value="name">Name</UiSelect.Option>
            <UiSelect.Option value="updatedAt">Modified date</UiSelect.Option>
            <UiSelect.Option value="createdAt">Created date</UiSelect.Option>
          </UiSelect>
        </div>
        <div className="flex-grow"></div>
        <UiButton
          variant="secondary"
          className="mr-2"
          onClick={() => importWorkflow()}
        >
          Import workflow
        </UiButton>
        <WorkflowCreateDialog />
      </div>
      {workflowsQuery.state === 'error' ? (
        <UiStateView
          type="error"
          className="mt-24"
          onAction={() => workflowsQuery.refresh()}
          description="Something went wrong when trying to fetch the workflows"
        />
      ) : (
        workflowsQuery.state === 'idle' && (
          <WorkflowCards workflows={filteredWorkflows} />
        )
      )}
    </div>
  );
}

export default RouteWorkflows;
