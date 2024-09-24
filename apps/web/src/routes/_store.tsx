import { ExtensionCategories } from '@/interface/extension.interface';
import {
  StoreQueryValidation,
  storeQueryValidation,
} from '@/validation/store-query.validation';
import { EXTENSION_CATEGORIES } from '@altdot/shared';
import {
  UiButton,
  cn,
  UiInput,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
} from '@altdot/ui';
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import clsx from 'clsx';
import {
  BlocksIcon,
  LucideIcon,
  GlobeIcon,
  BotIcon,
  FileTerminalIcon,
  FileClockIcon,
  CodeIcon,
  LayoutGridIcon,
  XIcon,
  MenuIcon,
  SearchIcon,
  ClockIcon,
  DownloadIcon,
} from 'lucide-react';
import { useState } from 'react';
import { useDebounceCallback } from 'usehooks-ts';
import { Helmet } from 'react-helmet-async';
import { APP_TITLE } from '@/utils/constant';

export const Route = createFileRoute('/_store')({
  component: StoreLayout,
  validateSearch: (search) => storeQueryValidation.parse(search),
});

const storeTypes = [
  { name: 'Extensions', path: '/store/extensions' },
  { name: 'Workflows', path: '/store/workflows' },
];
const storeSorts: {
  name: string;
  icon: LucideIcon;
  id: StoreQueryValidation['sortBy'];
}[] = [
  { name: 'Recently added', icon: ClockIcon, id: 'recently-added' },
  { name: 'Downloads count', icon: DownloadIcon, id: 'most-installed' },
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
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [show, setShow] = useState(false);

  return (
    <>
      <UiButton
        size="icon"
        variant="secondary"
        className="fixed bottom-4 left-4 z-[53] border shadow-xl lg:hidden"
        onClick={() => setShow(!show)}
      >
        {show ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </UiButton>
      <aside
        className={cn(
          'fixed bottom-0 left-0 z-[52] w-full rounded-t-lg border bg-background p-4 pb-16 md:bottom-4 md:left-16 md:w-52 md:rounded-lg md:pb-4 lg:relative lg:bottom-0 lg:left-0 lg:border-0 lg:bg-transparent lg:p-0',
          show ? 'block' : 'hidden lg:block',
        )}
      >
        <div>
          <p className="flex-1 text-sm font-semibold text-muted-foreground">
            Sort by
          </p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {storeSorts.map((sort) => (
              <li key={sort.id}>
                <button
                  className={clsx(
                    'relative flex h-10 w-full items-center rounded-md px-4 hover:bg-card',
                    search.sortBy === sort.id &&
                      'active-item-indicator bg-card text-foreground',
                  )}
                  onClick={() => {
                    navigate({
                      replace: true,
                      search: (prev) => ({ ...prev, sortBy: sort.id }),
                    });
                  }}
                >
                  <sort.icon className="mr-4 size-5" />
                  {sort.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex items-center">
          <p className="flex-1 text-sm font-semibold text-muted-foreground">
            Categories
          </p>
          {search.category && (
            <button
              className="text-sm text-muted-foreground underline"
              onClick={() => {
                navigate({
                  search: (prev) => ({ ...prev, category: undefined }),
                });
              }}
            >
              Clear
            </button>
          )}
        </div>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {Object.values(EXTENSION_CATEGORIES).map((category) => {
            const Icon = categoriesIcons[category];
            return (
              <li key={category}>
                <button
                  className={clsx(
                    'relative flex h-10 w-full items-center rounded-md px-4 hover:bg-card',
                    search.category === category &&
                      'active-item-indicator bg-card text-foreground',
                  )}
                  onClick={() => {
                    navigate({
                      replace: true,
                      search: (prev) => ({ ...prev, category }),
                    });
                  }}
                >
                  <Icon className="mr-4 size-5" />
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
          className="fixed left-0 top-0 z-[51] h-full w-full bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setShow(false)}
        ></div>
      )}
    </>
  );
}

function StoreFilter() {
  const location = useLocation();
  const searchParams = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const onQueryChange = useDebounceCallback((value: string) => {
    navigate({
      replace: true,
      search: (prev) => ({ ...prev, q: value }),
    });
  }, 500);

  return (
    <div className="mb-8 flex flex-col-reverse items-center gap-2 md:flex-row">
      <UiTabs
        value={location.pathname}
        onValueChange={(value) => {
          navigate({
            to: value,
            replace: true,
            search: location.search as StoreQueryValidation,
          });
        }}
        className="w-full md:w-auto"
      >
        <UiTabsList>
          {storeTypes.map((item) => (
            <UiTabsTrigger key={item.path} value={item.path}>
              {item.name}
            </UiTabsTrigger>
          ))}
        </UiTabsList>
      </UiTabs>
      <div className="flex-grow"></div>
      <UiInput
        type="search"
        wrapperClass="w-full md:w-auto"
        placeholder="Search..."
        onValueChange={onQueryChange}
        defaultValue={searchParams.q}
        prefixIcon={<SearchIcon className="size-5" />}
      />
    </div>
  );
}
function StoreLayout() {
  return (
    <main className="container pb-28 pt-36">
      <Helmet>
        <title>Store ー {APP_TITLE}</title>
        <meta
          name="description"
          content="Browse extensions and workflows built and shared by the community"
        />
      </Helmet>
      <h2 className="-mt-0.5 cursor-default text-3xl font-semibold leading-tight">
        Store
      </h2>
      <p className="text-muted-foreground">
        Browse extensions and workflows built and shared by the community
      </p>
      <div className="mt-12 items-start lg:flex">
        <StoreSidbear />
        <div className="flex-1 lg:ml-12">
          <StoreFilter />
          <Outlet />
        </div>
      </div>
    </main>
  );
}
