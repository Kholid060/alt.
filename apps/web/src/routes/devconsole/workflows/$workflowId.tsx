import {
  WorkflowDetail,
  WorkflowDetailHeader,
  WorkflowDetailRef,
} from '@/components/workflow/WorkflowDetail';
import WorkflowSelect from '@/components/workflow/WorkflowSelect';
import WorkflowViewer from '@/components/workflow/WorkflowViewer';
import APIService from '@/services/api.service';
import { PageError } from '@/utils/custom-error';
import { ApiWorkflowUserUpdatePayload, WebAppWorkflow } from '@alt-dot/shared';
import {
  UiBreadcrumb,
  UiBreadcrumbItem,
  UiBreadcrumbLink,
  UiBreadcrumbList,
  UiBreadcrumbPage,
  UiBreadcrumbSeparator,
  UiButton,
  UiButtonLoader,
  UiDialog,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
  UiDropdownMenuTrigger,
  UiLabel,
  UiSkeleton,
  useDialog,
  useToast,
} from '@alt-dot/ui';
import { UiListProvider } from '@alt-dot/ui/dist/context/list.context';
import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { EllipsisVerticalIcon, WorkflowIcon } from 'lucide-react';
import { useRef, useState } from 'react';

const queryData = (workflowId: string) =>
  queryOptions({
    refetchInterval: false,
    refetchOnWindowFocus: false,
    queryKey: ['me-workflows', workflowId],
    queryFn: () => APIService.instance.me.getWorkflow(workflowId),
  });

export const Route = createFileRoute('/devconsole/workflows/$workflowId')({
  async loader({ context, params }) {
    await context.queryClient.prefetchQuery(queryData(params.workflowId));
  },
  component: DevConsoleWorkflowsDetailPage,
});

function DevConsoleWorkflowsDetailPage() {
  const dialog = useDialog();
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = Route.useParams();
  const queryClient = useQueryClient();

  const query = useQuery({
    refetchOnMount: false,
    refetchInterval: false,
    retry(failureCount, error) {
      if ('status' in error && error.status === 404) return false;

      return failureCount <= 3;
    },
    ...queryData(params.workflowId),
  });

  const formRef = useRef<WorkflowDetailRef>(null);

  const [isUpdating, setIsUpdating] = useState(false);
  const [importedData, setImportedData] = useState<WebAppWorkflow | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  async function updateWorkflow() {
    try {
      if (!formRef.current || !query.data) return;

      const { form, containerEl } = formRef.current;
      if (!form.formState.isDirty && !importedData) return;

      const isValid = await form.trigger();
      if (!isValid) {
        containerEl?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      setIsUpdating(true);

      const updatePayload: ApiWorkflowUserUpdatePayload = {
        ...form.getValues(),
      };
      if (importedData) {
        updatePayload.icon = importedData.icon;
        updatePayload.workflow = importedData.workflow;
      }

      await APIService.instance.me.updateWorkflow(query.data.id, updatePayload);

      form.reset(form.getValues());
      queryClient.setQueryData(queryData(params.workflowId).queryKey, {
        ...query.data,
        ...updatePayload,
        updatedAt: new Date().toISOString(),
      });
      setImportedData(null);

      setIsUpdating(false);

      toast({ title: 'Workflow updated' });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong when publishing the workflow',
      });
      setIsUpdating(false);
    }
  }
  function onImportWorkflow(data: WebAppWorkflow) {
    if (!formRef.current) return;

    const { form } = formRef.current;
    form.setValue('name', data.name);
    form.setValue('description', data.description ?? '');
    setImportedData(data);
    setShowDialog(false);
  }
  async function deleteWorkflow() {
    try {
      if (!query.data) return;

      const isConfirmed = await dialog.confirm({
        title: 'Delete workflow?',
        body: (
          <>
            Are you sure you want to delete the{' '}
            <b>&quot;{query.data.name}&quot;</b> workflow? <br />
            This action cannot be undone
          </>
        ),
        okText: 'Delete',
        okButtonVariant: 'destructive',
      });
      if (!isConfirmed) return;

      setIsUpdating(true);

      await APIService.instance.me.deleteWorkflow(params.workflowId);

      queryClient.setQueryData(
        queryData(params.workflowId).queryKey,
        undefined,
      );
      await navigate({
        replace: true,
        to: '/devconsole/workflows',
      });

      setIsUpdating(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong when deleting the workflow',
      });
      setIsUpdating(false);
    }
  }

  if (query.isPending) {
    return (
      <div className="container pt-28">
        <div className="flex items-center">
          <UiSkeleton className="h-6 w-24" />
          <UiSkeleton className="ml-2 h-6 w-32" />
        </div>
        <div className="mt-8 flex items-center">
          <UiSkeleton className="size-14" />
          <div className="ml-4">
            <UiSkeleton className="h-7 w-40" />
            <UiSkeleton className="mt-2 h-4 w-64" />
          </div>
        </div>
        <hr className="my-8 border-border/40" />
        <UiSkeleton className="h-64 w-full max-w-xl" />
      </div>
    );
  }

  if (query.isError) {
    const isNotFound = 'status' in query.error && query.error.status === 404;
    if (isNotFound) {
      throw new PageError(404, {
        btnText: 'Back to Dashboard',
        path: '/devconsole/extensions',
      });
    }

    return (
      <div className="container mx-auto mt-12 flex max-w-md flex-col place-items-center pt-28 text-center">
        <div className="inline-block rounded-full bg-card/60 p-6 text-muted-foreground">
          <WorkflowIcon className="size-10" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">
          Couldn&apos;t load workflow
        </h2>
        {!isNotFound && (
          <p className="mt-1 leading-tight text-muted-foreground">
            Something went wrong when trying to fetch the workflow
          </p>
        )}
        <UiButton className="mt-8 min-w-40" onClick={() => query.refetch()}>
          Try again
        </UiButton>
      </div>
    );
  }

  const data = importedData ?? query.data;

  return (
    <div className="container py-28">
      <UiBreadcrumb>
        <UiBreadcrumbList>
          <UiBreadcrumbItem>
            <UiBreadcrumbLink asChild>
              <Link to="/devconsole/workflows">Dev Console</Link>
            </UiBreadcrumbLink>
          </UiBreadcrumbItem>
          <UiBreadcrumbSeparator />
          <UiBreadcrumbItem>
            <UiBreadcrumbPage>{query.data.name} workflow</UiBreadcrumbPage>
          </UiBreadcrumbItem>
        </UiBreadcrumbList>
      </UiBreadcrumb>
      <WorkflowDetailHeader
        icon={data.icon}
        className="mt-8"
        title={data.name}
        updatedAt={query.data.updatedAt}
        description={data.description ?? ''}
        suffixSlot={
          <>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger asChild>
                <UiButton
                  disabled={isUpdating}
                  size="icon"
                  className="mr-2"
                  variant="outline"
                >
                  <EllipsisVerticalIcon className="size-5" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent align="end">
                <UiDropdownMenuItem asChild>
                  <Link
                    to="/store/workflows/$workflowId"
                    params={{ workflowId: query.data.id }}
                    target="_blank"
                  >
                    Open in store
                  </Link>
                </UiDropdownMenuItem>
                <UiDropdownMenuSeparator />
                <UiDropdownMenuItem
                  variant="destructive"
                  onClick={deleteWorkflow}
                >
                  Delete workflow
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
            <UiButtonLoader isLoading={isUpdating} onClick={updateWorkflow}>
              Update
            </UiButtonLoader>
          </>
        }
      />
      <div className="mt-6 h-64 overflow-hidden rounded-lg border-2 border-border/70 md:h-96 lg:h-[500px]">
        <WorkflowViewer
          edges={data.workflow.edges}
          nodes={data.workflow.nodes}
        />
      </div>
      <WorkflowDetail
        ref={formRef}
        className="mt-12"
        workflow={query.data}
        prependSlot={
          <>
            <UiLabel className="col-span-5 mt-4 md:mt-0">Workflow data</UiLabel>
            <div className="col-span-5">
              <UiDialog open={showDialog} onOpenChange={setShowDialog}>
                <UiDialog.Trigger asChild>
                  <UiButton variant="secondary">Import data</UiButton>
                </UiDialog.Trigger>
                <UiDialog.Content className="z-[101] sm:max-w-[425px]">
                  <UiDialog.Header>
                    <UiDialog.Title>Import data</UiDialog.Title>
                    <UiDialog.Description>
                      Select a workflow you want import data from
                    </UiDialog.Description>
                  </UiDialog.Header>
                  <UiListProvider>
                    <WorkflowSelect onSelected={onImportWorkflow} />
                  </UiListProvider>
                </UiDialog.Content>
              </UiDialog>
              {importedData && (
                <UiButton
                  className="ml-2"
                  variant="secondary"
                  onClick={() => {
                    setImportedData(null);
                    formRef.current?.form.reset();
                  }}
                >
                  Reset
                </UiButton>
              )}
            </div>
          </>
        }
      />
    </div>
  );
}
