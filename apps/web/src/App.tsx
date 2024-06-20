import { useEffect } from 'react';
import SupabaseService from './services/supabase.service';
import APIService from './services/api.service';
import AppHeader from './components/app/AppHeader';
import {
  Outlet,
  isRouteErrorResponse,
  useNavigate,
  useRouteError,
} from 'react-router-dom';
import { DialogProvider, UiToaster } from '@alt-dot/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserStore } from './stores/user.store';
import { PageError } from './utils/custom-error';
import { ErrorNotFoundPage, ErrorPage } from './pages/ErrorPage';

const queryClient = new QueryClient();

function App() {
  const navigate = useNavigate();

  useEffect(() => {
    const stateChange = SupabaseService.instance.client.auth.onAuthStateChange(
      (event, session) => {
        console.log(event);
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
  }, [navigate]);

  return (
    <QueryClientProvider client={queryClient}>
      <DialogProvider>
        <AppHeader />
        <UiToaster />
        <Outlet />
      </DialogProvider>
    </QueryClientProvider>
  );
}

export function AppErrorBoundary() {
  const error = useRouteError();

  let page = <ErrorPage />;
  if (
    PageError.isPageError(error, 404) ||
    (isRouteErrorResponse(error) && error.status === 404)
  ) {
    page = (
      <ErrorNotFoundPage
        btnPath={error.data.path}
        btnText={error.data.btnText}
      />
    );
  }

  return <div className="h-screen w-screen py-12">{page}</div>;
}

export async function appLoader() {
  try {
    const session = await SupabaseService.instance.client.auth.getSession();
    if (!session.data.session) return null;

    APIService.instance.$setSession(session.data.session);
    const profile = await APIService.instance.me.get();
    useUserStore.getState().setProfile(profile);

    return profile;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default App;
