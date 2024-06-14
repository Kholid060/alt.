import SupabaseService, {
  SupabaseOAuthProvider,
} from '../../services/supabase.service';
import {
  UiButton,
  UiCard,
  UiCardContent,
  UiCardHeader,
  UiImage,
  UiLogo,
} from '@alt-dot/ui';
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
      <div className="absolute top-0 left-0 -z-10 h-4/6 w-8/12 bg-gradient-to-br from-transparent via-primary/30 dark:from-transparent dark:via-primary/15 to-40% to-transparent"></div>
      <UiCard className="w-full max-w-sm bg-background">
        <UiCardHeader>
          <UiLogo className="text-4xl" />
          <div className="text-muted-foreground">
            Create or sign in to your <UiLogo className="inline" /> app account
          </div>
        </UiCardHeader>
        <UiCardContent>
          <UiButton
            className="w-full justify-start h-12"
            variant="secondary"
            onClick={() => signInWithOAuth('google')}
          >
            <UiImage src={googleLogoSvg} alt="Google logo" className="size-6" />
            <p className="ml-4 text-base">Continue with Google</p>
          </UiButton>
          <UiButton
            className="w-full justify-start h-12 mt-3 "
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
        </UiCardContent>
      </UiCard>
    </div>
  );
}

export default AuthPage;
