import AppHeader from '@/components/app/AppHeader';
import AppLoadingIndicator, {
  AppLoadingPlaceholder,
} from '@/components/app/AppLoadingIndicator';
import { AppRouterContext } from '@/interface/app.interface';
import { DialogProvider, UiToaster } from '@alt-dot/ui';
import {
  createRootRouteWithContext,
  Outlet,
  redirect,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';

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
