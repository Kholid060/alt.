import { authGuard } from '@/guards/auth.guard';
import { routeBeforeLoadPipe } from '@/utils/route-utils';
import { Link, Outlet, createFileRoute } from '@tanstack/react-router';
import clsx from 'clsx';

export const Route = createFileRoute('/_settings')({
  component: SettingsLayout,
  beforeLoad: (data) => routeBeforeLoadPipe(data, [authGuard]),
});

const menu: { path: string; name: string }[] = [
  { path: 'profile', name: 'Profile' },
];

function SettingsNavigation() {
  return (
    <aside className="flex-shrink-0 lg:w-64">
      <ul className="flex items-center gap-2 space-y-1 text-muted-foreground lg:block">
        {menu.map((item) => (
          <li key={item.path} className="relative">
            <Link to={`/settings/${item.path}`}>
              {({ isActive }) => (
                <>
                  <span
                    className="absolute left-0 top-1/2 h-4/6 w-2 -translate-y-1/2 rounded-full bg-primary"
                    style={{ width: isActive ? 4 : 0 }}
                  ></span>
                  <span
                    className={clsx(
                      'flex h-10 w-full items-center rounded-md px-3 text-left hover:bg-secondary/70',
                      isActive && 'bg-secondary/70 text-foreground',
                    )}
                  >
                    {item.name}
                  </span>
                </>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function SettingsLayout() {
  return (
    <div className="container pb-14 pt-36">
      <h2 className="-mt-0.5 cursor-default text-2xl font-semibold leading-tight">
        Settings
      </h2>
      <div className="mt-12 flex flex-col lg:flex-row">
        <SettingsNavigation />
        <div className="mt-8 lg:ml-10 lg:mt-0 lg:flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
