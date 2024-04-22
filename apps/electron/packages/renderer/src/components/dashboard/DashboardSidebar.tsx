import { cn } from '@repo/ui';
import { NavLink } from 'react-router-dom';
import {
  BlocksIcon,
  InfoIcon,
  LucideIcon,
  SettingsIcon,
  UserCog2Icon,
  WorkflowIcon,
} from 'lucide-react';
import AppLogo from '#packages/renderer/assets/logo.svg';

const navigationItems: { title: string; path: string; icon: LucideIcon }[] = [
  {
    icon: BlocksIcon,
    path: '/extensions',
    title: 'Extensions',
  },
  {
    icon: UserCog2Icon,
    path: '/accounts',
    title: 'Accounts',
  },
  {
    icon: WorkflowIcon,
    path: '/workflows/workflowId',
    title: 'Workflows',
  },
  {
    path: '/settings',
    title: 'Settings',
    icon: SettingsIcon,
  },
];

function DashboardSidebar() {
  return (
    <div className="w-20 lg:w-64 border-r h-screen py-8 px-4 flex flex-col gap-8 fixed left-0 top-0">
      <div className="flex items-center justify-center lg:justify-start gap-3">
        <img src={AppLogo} alt="App logo" className="h-6 w-6" />
        <h1 className="text-xl font-semibold hidden lg:block linc">App Name</h1>
      </div>
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
