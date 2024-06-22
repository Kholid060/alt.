import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import AppErrorBoundary from './components/app/AppErrorBoundary';
import { routeTree } from './routeTree.gen';
import { useEffect, useState } from 'react';
import { AppLoadingPlaceholder } from './components/app/AppLoadingIndicator';
import APIService from './services/api.service';
import SupabaseService from './services/supabase.service';
import { useUserStore } from './stores/user.store';
import { UserProfile } from './interface/user.interface';
import { ErrorNotFoundPage } from './components/ErrorPage';

const router = createRouter({
  routeTree,
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

const queryClient = new QueryClient();

function App() {
  const [profile, setProfile] = useState<{
    isFetched: boolean;
    data: UserProfile | null;
  }>({ isFetched: false, data: null });

  useEffect(() => {
    const fetchProfile = async () => {
      let userProfile: UserProfile | null = null;

      try {
        const session = await SupabaseService.instance.client.auth.getSession();
        if (!session.data.session) return;

        APIService.instance.$setSession(session.data.session);

        userProfile = await APIService.instance.me.get();
        useUserStore.getState().setProfile(userProfile);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error);
        }
      } finally {
        setProfile({
          isFetched: true,
          data: userProfile,
        });
      }
    };
    fetchProfile();
  }, []);

  if (!profile.isFetched) {
    return <AppLoadingPlaceholder />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider
        router={router}
        context={{ queryClient, userProfile: profile.data }}
      />
    </QueryClientProvider>
  );
}

export default App;
