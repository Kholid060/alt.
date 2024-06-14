import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';

const menu: { path: string; name: string }[] = [
  { path: 'profile', name: 'Profile' },
];

function SettingsNavigation() {
  return (
    <aside className="lg:w-64 flex-shrink-0">
      <ul className="space-y-1 text-muted-foreground flex items-center gap-2 lg:block">
        {menu.map((item) => (
          <li key={item.path} className="relative">
            <NavLink to={`/settings/${item.path}`}>
              {({ isActive }) => (
                <>
                  <span
                    className="h-4/6 w-2 bg-primary left-0 absolute top-1/2 -translate-y-1/2 rounded-full"
                    style={{ width: isActive ? 4 : 0 }}
                  ></span>
                  <span
                    className={clsx(
                      'h-10 w-full text-left rounded-md px-3 hover:bg-secondary/70 flex items-center',
                      isActive && 'bg-secondary/70 text-foreground',
                    )}
                  >
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}

function SettingsLayout() {
  return (
    <div className="container pt-36 pb-14">
      <h2 className="text-2xl font-semibold cursor-default leading-tight -mt-0.5">
        Settings
      </h2>
      <div className="flex flex-col lg:flex-row mt-12">
        <SettingsNavigation />
        <div className="lg:flex-1 lg:ml-10 lg:mt-0 mt-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default SettingsLayout;
