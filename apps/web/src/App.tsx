import { useEffect } from 'react';
import SupabaseService from './services/supabase.service';
import APIService from './services/api.service';
import AppHeader from './components/app/AppHeader';
import { Outlet, useNavigate } from 'react-router-dom';
import { DialogProvider, UiToaster } from '@alt-dot/ui';
import { useUserStore } from './stores/user.store';

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
    <DialogProvider>
      <AppHeader />
      <UiToaster />
      <Outlet />
    </DialogProvider>
  );
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
