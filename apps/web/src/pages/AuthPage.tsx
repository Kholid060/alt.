import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import SupabaseService from '../services/supabase.service';

function AuthPage() {
  return (
    <div className="h-screen container">
      <Auth
        supabaseClient={SupabaseService.instance.client}
        appearance={{ theme: ThemeSupa }}
      />
    </div>
  );
}

export default AuthPage;
