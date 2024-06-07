import { cn } from '@repo/ui';
import { NavLink } from 'react-router-dom';
import {
  BlocksIcon,
  HistoryIcon,
  InfoIcon,
  KeyRoundIcon,
  LucideIcon,
  SettingsIcon,
  UserCog2Icon,
  WorkflowIcon,
} from 'lucide-react';
import { useDashboardStore } from '/@/stores/dashboard.store';
import { useEffect } from 'react';

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
    icon: UserCog2Icon,
    path: '/accounts',
    title: 'Accounts',
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
      <h1
        className="text-3xl text-center lg:text-left lg:text-4xl font-semibold leading-none cursor-default select-none"
        style={{ fontFeatureSettings: '"ss02"' }}
      >
        alt<span className="text-primary">.</span>
      </h1>
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
      <li className="p-3 gap-3 rounded-md flex items-center hover:bg-secondary-hover transition">
        <InfoIcon className="h-5 w-5" />
        <p>About</p>
      </li>
    </div>
  );
}

export default DashboardSidebar;
