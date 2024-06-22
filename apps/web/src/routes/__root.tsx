import AppHeader from '@/components/app/AppHeader';
import AppLoadingIndicator, {
  AppLoadingPlaceholder,
} from '@/components/app/AppLoadingIndicator';
import { AppRouterContext } from '@/interface/app.interface';
import APIService from '@/services/api.service';
import SupabaseService from '@/services/supabase.service';
import { DialogProvider, UiToaster } from '@alt-dot/ui';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { useEffect } from 'react';

export const Route = createRootRouteWithContext<AppRouterContext>()({
  component: AppRoot,
  pendingComponent: () => <AppLoadingPlaceholder />,
});

function AppRoot() {
  useEffect(() => {
    const stateChange = SupabaseService.instance.client.auth.onAuthStateChange(
      (event, session) => {
        switch (event) {
          case 'INITIAL_SESSION':
          case 'TOKEN_REFRESHED':
            APIService.instance.$setSession(session);
            break;
          case 'SIGNED_OUT':
            window.location.href = '/';
            break;
        }
      },
    );

    return () => {
      stateChange.data.subscription.unsubscribe();
    };
  }, []);

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
