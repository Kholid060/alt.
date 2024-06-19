import { ExtensionCategories } from '@/interface/extension.interface';
import { EXTENSION_CATEGORIES } from '@alt-dot/extension-core';
import {
  UiButton,
  UiInput,
  UiToggleGroup,
  UiToggleGroupItem,
  cn,
} from '@alt-dot/ui';
import clsx from 'clsx';
import {
  BlocksIcon,
  BotIcon,
  CodeIcon,
  FileClockIcon,
  FileTerminalIcon,
  GlobeIcon,
  LayoutGridIcon,
  LucideIcon,
  MenuIcon,
  SearchIcon,
  WorkflowIcon,
  XIcon,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useSearchParams } from 'react-router-dom';
import { useDebounceCallback } from 'usehooks-ts';

const storeTypes = [
  { name: 'Extensions', icon: BlocksIcon, path: '/store/extensions' },
  { name: 'Workflows', icon: WorkflowIcon, path: '/store/workflows' },
];

const categoriesIcons: Record<ExtensionCategories, LucideIcon> = {
  Web: GlobeIcon,
  Other: BlocksIcon,
  Automation: BotIcon,
  Scripts: FileTerminalIcon,
  Productivity: FileClockIcon,
  'Developer Tools': CodeIcon,
  Applications: LayoutGridIcon,
};
function StoreSidbear() {
  const [show, setShow] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const activeCategory = searchParams.get('category');

  return (
    <>
      <UiButton
        size="icon"
        variant="secondary"
        className="border fixed bottom-4 left-4 shadow-xl z-[53] lg:hidden"
        onClick={() => setShow(!show)}
      >
        {show ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </UiButton>
      <aside
        className={cn(
          'w-full lg:border-0 lg:left-0 lg:bottom-0 md:left-16 md:bottom-4 md:w-64 md:pb-4 lg:p-0 border rounded-t-lg md:rounded-lg p-4 fixed left-0 bottom-0 bg-background z-[52] lg:relative lg:bg-transparent pb-16',
          show ? 'block' : 'hidden lg:block',
        )}
      >
        <ul className="space-y-1">
          {storeTypes.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center px-4 h-10 rounded-md hover:bg-card relative',
                    isActive
                      ? 'active-item-indicator bg-card'
                      : 'text-muted-foreground',
                  )
                }
              >
                <item.icon className="mr-4 size-5" /> {item.name}
              </NavLink>
            </li>
          ))}
        </ul>
        <p className="font-semibold text-sm text-muted-foreground mt-4">
          Categories
        </p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {Object.values(EXTENSION_CATEGORIES).map((category) => {
            const Icon = categoriesIcons[category];
            return (
              <li key={category}>
                <button
                  className={clsx(
                    'flex items-center px-4 h-10 rounded-md hover:bg-card relative w-full',
                    activeCategory === category &&
                      'active-item-indicator bg-card text-foreground',
                  )}
                  onClick={() => {
                    searchParams.set('category', category);
                    setSearchParams(searchParams, { replace: true });
                  }}
                >
                  <Icon className="size-5 mr-4" />
                  {category}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      {show && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className="bg-black/50 fixed top-0 left-0 h-full w-full z-[51] backdrop-blur-sm lg:hidden"
          onClick={() => setShow(false)}
        ></div>
      )}
    </>
  );
}

function StoreFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeSort = searchParams.get('sortBy');

  const onQueryChange = useDebounceCallback((value: string) => {
    setSearchParams(
      (prevValue) => {
        prevValue.set('q', value);
        return prevValue;
      },
      { replace: true },
    );
  }, 500);

  return (
    <div className="flex items-center flex-col-reverse md:flex-row gap-2 mb-8">
      <UiToggleGroup
        type="single"
        className="text-muted-foreground w-full md:w-auto"
        value={activeSort ?? 'recently-added'}
        onValueChange={(value) => {
          searchParams.set('sortBy', value);
          setSearchParams(searchParams, { replace: true });
        }}
      >
        <UiToggleGroupItem value="recently-added" defaultChecked>
          Recently added
        </UiToggleGroupItem>
        <UiToggleGroupItem value="most-installed">
          Most installed
        </UiToggleGroupItem>
      </UiToggleGroup>
      <div className="flex-grow"></div>
      <UiInput
        type="search"
        wrapperClass="w-full md:w-auto"
        placeholder="Search..."
        onValueChange={onQueryChange}
        defaultValue={searchParams.get('q') ?? ''}
        prefixIcon={<SearchIcon className="size-5" />}
      />
    </div>
  );
}

function StoreLayout() {
  return (
    <main className="pt-36 container">
      <h2 className="text-3xl font-semibold cursor-default leading-tight -mt-0.5">
        Store
      </h2>
      <p className="text-muted-foreground">
        Browse extensions and workflows built and shared by the community
      </p>
      <div className="lg:flex items-start mt-12">
        <StoreSidbear />
        <div className="flex-1 lg:ml-8">
          <StoreFilter />
          <Outlet />
        </div>
      </div>
    </main>
  );
}

export default StoreLayout;
