import WorkflowViewer from '@/components/workflow/WorkflowViewer';
import {
  Link,
  createFileRoute,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import '@/assets/css/workflow-viewer.css';
import {
  UiBreadcrumb,
  UiBreadcrumbList,
  UiBreadcrumbItem,
  UiBreadcrumbLink,
  UiBreadcrumbSeparator,
  UiBreadcrumbPage,
  useToast,
  UiButtonLoader,
} from '@alt-dot/ui';
import {
  WorkflowDetail,
  WorkflowDetailHeader,
  WorkflowDetailRef,
} from '@/components/workflow/WorkflowDetail';
import { useRef, useState } from 'react';
import APIService from '@/services/api.service';

export const Route = createFileRoute('/devconsole/workflows/new')({
  component: DevConsoleWorkflowsNewPage,
  async loader({ location }) {
    if (!location.state.newWorkflow) {
      throw redirect({
        replace: true,
        to: '/devconsole/extensions',
      });
    }

    return location.state.newWorkflow;
  },
});

function DevConsoleWorkflowsNewPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const data = Route.useLoaderData();

  const formRef = useRef<WorkflowDetailRef>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  async function publishWorkflow() {
    try {
      if (!formRef.current || isPublishing) return;

      const { containerEl, form } = formRef.current;

      const isValid = await form.trigger();
      if (!isValid) {
        containerEl?.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      setIsPublishing(true);

      const values = form.getValues();

      const result = await APIService.instance.me.createWorkflow({
        ...values,
        icon: data.icon,
        workflow: data.workflow,
      });
      if (!result.success) return;

      await navigate({
        to: '/devconsole/workflows/$workflowId',
        params: { workflowId: result.data.workflowId },
      });

      setIsPublishing(false);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong when publishing the workflow',
      });
      setIsPublishing(false);
    }
  }

  return (
    <div className="container py-28">
      <UiBreadcrumb>
        <UiBreadcrumbList>
          <UiBreadcrumbItem>
            <UiBreadcrumbLink asChild>
              <Link to="/devconsole/extensions">Dev Console</Link>
            </UiBreadcrumbLink>
          </UiBreadcrumbItem>
          <UiBreadcrumbSeparator />
          <UiBreadcrumbItem>
            <UiBreadcrumbPage>Share workflow</UiBreadcrumbPage>
          </UiBreadcrumbItem>
        </UiBreadcrumbList>
      </UiBreadcrumb>
      <WorkflowDetailHeader
        icon={data.icon}
        title={data.name}
        iconUrl={data.icon}
        className="mt-8"
        description={data.description ?? ''}
        suffixSlot={
          <UiButtonLoader isLoading={isPublishing} onClick={publishWorkflow}>
            Publish
          </UiButtonLoader>
        }
      ></WorkflowDetailHeader>
      <div className="mt-6 h-64 md:h-96 lg:h-[500px] rounded-lg border-2 overflow-hidden border-border/70">
        <WorkflowViewer
          edges={data.workflow.edges}
          nodes={data.workflow.nodes}
        />
      </div>
      <WorkflowDetail ref={formRef} className="mt-12" workflow={data} />
    </div>
  );
}
