import AppHeader from '@/components/app/AppHeader';
import AppLoadingIndicator, {
  AppLoadingPlaceholder,
} from '@/components/app/AppLoadingIndicator';
import { AppRouterContext } from '@/interface/app.interface';
import { DialogProvider, UiToaster } from '@altdot/ui';
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { lazy } from 'react';

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null
    : lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
        })),
      );

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: AppRoot,
  wrapInSuspense: true,
  beforeLoad({ context, location }) {
    if (
      context.userProfile &&
      !context.userProfile.username &&
      location.pathname !== '/settings/profile'
    ) {
      throw redirect({
        to: '/settings/profile',
        search: { username: true },
      });
    }
  },
  pendingComponent: () => <AppLoadingPlaceholder />,
});

function AppRoot() {
  return (
    <DialogProvider>
      <AppHeader />
      <UiToaster />
      <Outlet />
      <AppLoadingIndicator />
      <TanStackRouterDevtools />
    </DialogProvider>
  );
}
