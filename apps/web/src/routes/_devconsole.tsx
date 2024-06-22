import DevConsoleNewExtension from '@/components/devconsole/DevConsoleNewExtension';
import DevConsoleNewWorkflow from '@/components/devconsole/DevConsoleNewWorkflow';
import { authGuard } from '@/guards/auth.guard';
import { routeBeforeLoadPipe } from '@/utils/route-utils';
import {
  UiButton,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuTrigger,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
} from '@alt-dot/ui';
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { PlusIcon, BlocksIcon, WorkflowIcon } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/_devconsole')({
  component: DevConsoleLayout,
  beforeLoad: (data) => routeBeforeLoadPipe(data, [authGuard]),
});

function AddItem() {
  const [activeItem, setActiveItem] = useState<'extension' | 'workflow' | null>(
    null,
  );

  return (
    <>
      <UiDropdownMenu>
        <UiDropdownMenuTrigger asChild>
          <UiButton>
            <PlusIcon className="size-5 mr-2 -ml-0.5" />
            Item
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent className="w-40" align="end">
          <UiDropdownMenuItem onClick={() => setActiveItem('extension')}>
            <BlocksIcon className="mr-2 size-4" />
            Extension
          </UiDropdownMenuItem>
          <UiDropdownMenuItem onClick={() => setActiveItem('workflow')}>
            <WorkflowIcon className="mr-2 size-4" />
            Workflow
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
      {activeItem === 'extension' ? (
        <DevConsoleNewExtension onClose={() => setActiveItem(null)} />
      ) : activeItem === 'workflow' ? (
        <DevConsoleNewWorkflow onClose={() => setActiveItem(null)} />
      ) : null}
    </>
  );
}

function DevConsoleLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="pt-36 container">
      <h2 className="text-2xl font-semibold cursor-default leading-tight -mt-0.5">
        Dev Console
      </h2>
      <div className="mt-8 flex items-center justify-between">
        <UiTabs
          value={location.pathname}
          onValueChange={(value) => navigate({ to: value, replace: true })}
        >
          <UiTabsList>
            <UiTabsTrigger value="/devconsole/extensions">
              Extensions
            </UiTabsTrigger>
            <UiTabsTrigger value="/devconsole/workflows">
              Workflows
            </UiTabsTrigger>
          </UiTabsList>
        </UiTabs>
        <AddItem />
      </div>
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
