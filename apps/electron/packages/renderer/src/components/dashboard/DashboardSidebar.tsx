import { UiButton, UiDialog, cn } from '@altdot/ui';
import { NavLink } from 'react-router-dom';
import {
  BlocksIcon,
  ExternalLinkIcon,
  HistoryIcon,
  InfoIcon,
  LucideIcon,
  SettingsIcon,
  WorkflowIcon,
} from 'lucide-react';
import { useDashboardStore } from '/@/stores/dashboard.store';
import { useEffect, useState } from 'react';
import UiLogo from '../ui/UiLogo';
import preloadAPI from '/@/utils/preloadAPI';
import { AppVersions } from '#packages/common/interface/app.interface';
import WebURL from '#packages/common/utils/WebURL';

const navigationItems: { title: string; path: string; icon: LucideIcon }[] = [
  {
    icon: BlocksIcon,
    path: '/extensions',
    title: 'Extensions',
  },
  {
    icon: WorkflowIcon,
    path: '/workflows',
    title: 'Workflows',
  },
  {
    icon: HistoryIcon,
    path: '/workflow-history',
    title: 'Workflow history',
  },
  // {
  //   icon: KeyRoundIcon,
  //   path: '/credentials',
  //   title: 'Credentials',
  // },
  {
    path: '/settings',
    title: 'Settings',
    icon: SettingsIcon,
  },
];

function AboutApp() {
  const [versions, setVersions] = useState<AppVersions>({
    os: '-',
    app: '-',
  });

  useEffect(() => {
    preloadAPI.main.ipc
      .invokeWithError('app:versions')
      .then(setVersions)
      .catch(console.error);
  }, []);

  return (
    <>
      <UiDialog.Header>
        <UiLogo className="text-4xl" />
      </UiDialog.Header>
      <div>
        <p>version {versions.app}</p>
        <p className="text-sm text-muted-foreground">{versions.os}</p>
        <UiButton
          variant="secondary"
          size="sm"
          onClick={() => preloadAPI.main.ipc.send('app:check-update')}
          className="mt-4"
        >
          Check for update
        </UiButton>
      </div>
      <UiDialog.Footer className="justify-start pt-6">
        <UiButton
          variant="secondary"
          size="sm"
          onClick={() =>
            preloadAPI.main.ipc.invoke(
              'shell:open-url',
              'https://docs.altdot.app',
            )
          }
        >
          <ExternalLinkIcon className="mr-2 size-4" />
          Documentation
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          onClick={() =>
            preloadAPI.main.ipc.invoke('shell:open-url', WebURL.baseURL)
          }
        >
          <ExternalLinkIcon className="mr-2 size-4" />
          Website
        </UiButton>
        <div className="flex-grow"></div>
        <UiButton
          variant="secondary"
          size="sm"
          onClick={() =>
            preloadAPI.main.ipc.invoke(
              'shell:open-url',
              'https://github.com/Kholid060/alt./issues/new/choose',
            )
          }
        >
          <ExternalLinkIcon className="mr-2 size-4" />
          Report bug
        </UiButton>
      </UiDialog.Footer>
    </>
  );
}

function DashboardSidebar({
  onVisibilityChange,
}: {
  onVisibilityChange: (hide: boolean) => void;
}) {
  const hideSidebar = useDashboardStore.use.hideSidebar();

  useEffect(() => {
    onVisibilityChange(hideSidebar);
  }, [hideSidebar, onVisibilityChange]);

  if (hideSidebar) return null;

  return (
    <div className="fixed left-0 top-0 flex h-screen w-20 flex-col gap-7 border-r px-4 pb-8 pt-6 lg:w-64">
      <UiLogo className="text-center text-3xl lg:text-left lg:text-4xl" />
      <ul className="space-y-2 text-muted-foreground">
        {navigationItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-center gap-3 overflow-hidden rounded-md p-3 transition lg:justify-start',
                isActive
                  ? 'bg-secondary text-foreground dark:bg-card'
                  : 'hover:bg-card/80',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <p className="hidden lg:block">{item.title}</p>
          </NavLink>
        ))}
      </ul>
      <div className="flex-grow"></div>
      <UiDialog>
        <UiDialog.Trigger className="flex items-center justify-center gap-3 overflow-hidden rounded-md p-3 text-muted-foreground transition hover:bg-card/80 lg:justify-start">
          <InfoIcon className="h-5 w-5" />
          <p className="hidden lg:block">About</p>
        </UiDialog.Trigger>
        <UiDialog.Content>
          <AboutApp />
        </UiDialog.Content>
      </UiDialog>
    </div>
  );
}

export default DashboardSidebar;
