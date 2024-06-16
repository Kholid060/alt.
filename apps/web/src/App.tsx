import { useEffect, useState } from 'react';
import SupabaseService from './services/supabase.service';
import APIService from './services/api.service';
import { Session } from '@supabase/supabase-js';
import { useUserStore } from './stores/user.store';
import AppHeader from './components/app/AppHeader';
import { Outlet, useNavigate } from 'react-router-dom';
import { UiToaster } from '@alt-dot/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  const navigate = useNavigate();

  const [initiated, setInitiated] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async (session: Session | null) => {
      try {
        if (!session) return;

        const profile = await useUserStore.getState().fetchProfile();
        if (profile && !profile.username) {
          navigate('/settings/profile?username=true');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setInitiated(true);
      }
    };
    console.log(SupabaseService.instance);
    const stateChange = SupabaseService.instance.client.auth.onAuthStateChange(
      (event, session) => {
        switch (event) {
          case 'INITIAL_SESSION': {
            APIService.instance.$setSession(session);
            fetchUserProfile(session);
            break;
          }
          case 'TOKEN_REFRESHED':
            APIService.instance.$setSession(session);
            break;
          case 'SIGNED_OUT':
            APIService.instance.$setSession(null);
            navigate('/', { replace: true });
            useUserStore.getState().setProfile(null);
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
      <AppHeader />
      <UiToaster />
      {initiated && <Outlet />}
    </QueryClientProvider>
  );
}

export default App;
