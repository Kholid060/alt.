import { UiButton, UiDialog, cn } from '@repo/ui';
import { NavLink } from 'react-router-dom';
import {
  BlocksIcon,
  ExternalLinkIcon,
  HistoryIcon,
  InfoIcon,
  KeyRoundIcon,
  LucideIcon,
  SettingsIcon,
  WorkflowIcon,
} from 'lucide-react';
import { useDashboardStore } from '/@/stores/dashboard.store';
import { useEffect, useState } from 'react';
import UiLogo from '../ui/UiLogo';
import preloadAPI from '/@/utils/preloadAPI';
import { AppVersions } from '#packages/common/interface/app.interface';

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
  {
    icon: KeyRoundIcon,
    path: '/credentials',
    title: 'Credentials',
  },
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
      </div>
      <UiDialog.Footer className="pt-6 justify-start">
        <UiButton
          variant="secondary"
          size="sm"
          onClick={() =>
            preloadAPI.main.ipc.invoke('shell:open-url', 'https://example.com')
          }
        >
          <ExternalLinkIcon className="size-4 mr-2" />
          Documentation
        </UiButton>
        <UiButton
          variant="secondary"
          size="sm"
          onClick={() =>
            preloadAPI.main.ipc.invoke('shell:open-url', 'https://example.com')
          }
        >
          <ExternalLinkIcon className="size-4 mr-2" />
          Website
        </UiButton>
        <div className="flex-grow"></div>
        <UiButton
          variant="secondary"
          size="sm"
          onClick={() =>
            preloadAPI.main.ipc.invoke('shell:open-url', 'https://example.com')
          }
        >
          <ExternalLinkIcon className="size-4 mr-2" />
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
    <div className="w-20 lg:w-64 border-r h-screen pb-8 pt-6 px-4 flex flex-col gap-7 fixed left-0 top-0">
      <UiLogo className="text-3xl text-center lg:text-left lg:text-4xl" />
      <ul className="text-muted-foreground space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.path}
            className={({ isActive }) =>
              cn(
                'p-3 gap-3 rounded-md flex items-center transition justify-center lg:justify-start overflow-hidden',
                isActive ? 'bg-card text-foreground' : 'hover:bg-card/80',
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
        <UiDialog.Trigger className="p-3 gap-3 rounded-md flex items-center transition justify-center lg:justify-start overflow-hidden hover:bg-card/80 text-muted-foreground">
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
