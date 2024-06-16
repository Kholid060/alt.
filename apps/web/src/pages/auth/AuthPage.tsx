import SupabaseService, {
  SupabaseOAuthProvider,
} from '../../services/supabase.service';
import { UiButton, UiImage, UiLogo } from '@alt-dot/ui';
import googleLogoSvg from '@/assets/logo/google.svg';
import githubLogoWhiteSvg from '@/assets/logo/github-white.svg';

function AuthPage() {
  function signInWithOAuth(provider: SupabaseOAuthProvider) {
    const redirectTo = new URLSearchParams(window.location.search).get(
      'redirectTo',
    );
    const params = redirectTo ? { redirectTo } : undefined;

    SupabaseService.instance.signInWithOAuth(provider, { params });
  }

  return (
    <div className="h-screen w-screen grid place-items-center px-4">
      <div className="w-full max-w-xs bg-background text-center border-0">
        <UiLogo className="text-5xl" />
        <div className="text-muted-foreground mt-2">
          Create or sign in to your <UiLogo className="inline" /> app account
        </div>
        <div className="mt-12">
          <UiButton
            className="w-full justify-start h-12"
            variant="secondary"
            onClick={() => signInWithOAuth('google')}
          >
            <UiImage src={googleLogoSvg} alt="Google logo" className="size-6" />
            <p className="ml-4 text-base">Continue with Google</p>
          </UiButton>
          <UiButton
            className="w-full justify-start h-12 mt-4 "
            variant="secondary"
            onClick={() => signInWithOAuth('github')}
          >
            <UiImage
              src={githubLogoWhiteSvg}
              alt="GitHub logo"
              className="size-6"
            />
            <p className="ml-4 text-base">Continue with GitHub</p>
          </UiButton>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
