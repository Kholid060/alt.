import APIService from '@/services/api.service';
import {
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiTabs,
  UiTabsList,
  UiTabsTrigger,
} from '@alt-dot/ui';
import { queryOptions } from '@tanstack/react-query';
import {
  Outlet,
  createFileRoute,
  useLocation,
  useNavigate,
} from '@tanstack/react-router';
import { GlobeIcon, UserRoundIcon } from 'lucide-react';
import githubLogoWhiteSvg from '@/assets/logo/github-white.svg';
import dayjs from 'dayjs';

function queryData(username: string) {
  return queryOptions({
    queryKey: ['users', username],
    queryFn: () => APIService.instance.user.get(username),
  });
}

export const Route = createFileRoute('/u/$username')({
  component: UserLayout,
  loader({ params, context }) {
    return context.queryClient.ensureQueryData(queryData(params.username));
  },
});

const userTabs = [
  { name: 'Extensions', path: 'extensions' },
  { name: 'Workflows', path: 'workflows' },
];

function UserTabs() {
  const navigate = useNavigate();
  const params = Route.useParams();
  const location = useLocation().pathname.split('/').pop();

  return (
    <UiTabs
      value={location}
      onValueChange={(path) =>
        navigate({ to: `/u/${params.username}/${path}`, replace: true })
      }
      className="mb-8"
    >
      <UiTabsList>
        {userTabs.map((tab) => (
          <UiTabsTrigger key={tab.path} value={tab.path}>
            {tab.name}
          </UiTabsTrigger>
        ))}
      </UiTabsList>
    </UiTabs>
  );
}
function UserLayout() {
  const data = Route.useLoaderData();

  return (
    <div className="container pt-36 lg:flex lg:items-start">
      <div className="w-56">
        <UiAvatar className="size-28">
          <UiAvatarImage src={data.avatarUrl ?? undefined} />
          <UiAvatarFallback>
            <UserRoundIcon className="size-16 text-muted-foreground" />
          </UiAvatarFallback>
        </UiAvatar>
        <p className="mt-4 text-xl font-semibold">{data.name}</p>
        <p className="text-muted-foreground">@{data.username}</p>
        <div className="mt-4 space-y-3 text-sm text-muted-foreground">
          {data.githubHandle && (
            <div className="flex items-center">
              <div className="w-7">
                <img
                  src={githubLogoWhiteSvg}
                  alt="GitHub logo"
                  className="col-span-1 size-4"
                />
              </div>
              <a
                className="hover:text-foreground hover:underline"
                target="_blank"
                rel="noreferrer"
                href={`https://github.com/${data.githubHandle}`}
              >
                {data.githubHandle}
              </a>
            </div>
          )}
          {data.website && (
            <div className="flex items-center">
              <div className="w-7">
                <GlobeIcon className="size-4" />
              </div>
              <a
                className="hover:text-foreground hover:underline"
                target="_blank"
                rel="noreferrer"
                href={data.website}
              >
                {new URL(data.website).hostname}
              </a>
            </div>
          )}
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Joined {dayjs(data.createdAt).fromNow()}
        </p>
      </div>
      <hr className="my-10 lg:hidden" />
      <div className="flex-1 lg:mt-0 lg:pl-12">
        <UserTabs />
        <Outlet />
      </div>
    </div>
  );
}
