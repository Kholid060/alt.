import SupabaseService from '@/services/supabase.service';
import { useUserStore } from '@/stores/user.store';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AuthRedirectPage() {
  const profile = useUserStore.use.profile();

  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      navigate(profile.username ? '/' : '/settings/profile?username=true');
      return;
    }

    SupabaseService.instance.client.auth.getSession().then((session) => {
      if (session.data.session) {
        navigate('/');
      }
    });
  }, [profile, navigate]);

  return <p className="my-8 text-center">Redirecting...</p>;
}

export default AuthRedirectPage;
