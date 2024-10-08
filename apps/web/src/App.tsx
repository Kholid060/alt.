import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import AppErrorBoundary from './components/app/AppErrorBoundary';
import { routeTree } from './routeTree.gen';
import { useEffect } from 'react';
import { AppLoadingPlaceholder } from './components/app/AppLoadingIndicator';
import APIService from './services/api.service';
import SupabaseService from './services/supabase.service';
import { useUserStore } from './stores/user.store';
import { UserProfile } from './interface/user.interface';
import { ErrorNotFoundPage } from './components/ErrorPage';
import { useShallow } from 'zustand/react/shallow';
import { HelmetProvider } from 'react-helmet-async';
import { UiTooltipProvider } from '@altdot/ui';

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient,
    userProfile: null,
  },
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: AppErrorBoundary,
  defaultNotFoundComponent: () => (
    <div className="mt-24">
      <ErrorNotFoundPage />
    </div>
  ),
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  const [profile, profileFetched] = useUserStore(
    useShallow((state) => [state.profile, state.profileFetched]),
  );

  useEffect(() => {
    const fetchProfile = async () => {
      let userProfile: UserProfile | null = null;

      try {
        const session = await SupabaseService.instance.client.auth.getSession();
        if (!session.data.session) return;

        APIService.instance.$setAccessToken(session.data.session.access_token);

        userProfile = await APIService.instance.me.get();
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      } finally {
        useUserStore.getState().setProfile(userProfile);
      }
    };
    fetchProfile();
  }, []);

  if (!profileFetched) return <AppLoadingPlaceholder />;

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <UiTooltipProvider>
          <RouterProvider
            router={router}
            context={{ queryClient, userProfile: profile }}
          />
        </UiTooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
