import { createFileRoute } from '@tanstack/react-router';
import SupabaseService, {
  SupabaseOAuthProvider,
} from '../../services/supabase.service';
import { UiButton, UiImage, UiLogo } from '@altdot/ui';
import googleLogoSvg from '@/assets/logo/google.svg';
import githubLogoWhiteSvg from '@/assets/logo/github-white.svg';
import { routeBeforeLoadPipe } from '@/utils/route-utils';
import { noAuthGuard } from '@/guards/auth.guard';
import { useHideFooter } from '@/hooks/useHideFooter';

export const Route = createFileRoute('/auth/')({
  component: AuthPage,
  beforeLoad: (data) => routeBeforeLoadPipe(data, [noAuthGuard]),
});

function AuthPage() {
  useHideFooter();

  function signInWithOAuth(provider: SupabaseOAuthProvider) {
    const redirectTo = new URLSearchParams(window.location.search).get(
      'redirectTo',
    );
    const params = redirectTo ? { redirectTo } : undefined;

    SupabaseService.instance.signInWithOAuth(provider, { params });
  }

  return (
    <div className="grid h-screen w-screen place-items-center px-4">
      <div className="w-full max-w-xs border-0 bg-background text-center">
        <UiLogo className="text-5xl" />
        <div className="mt-2 text-muted-foreground">
          Create or sign in to your <UiLogo className="inline" /> app account
        </div>
        <div className="mt-12">
          <UiButton
            className="h-12 w-full justify-start"
            variant="secondary"
            onClick={() => signInWithOAuth('google')}
          >
            <UiImage src={googleLogoSvg} alt="Google logo" className="size-6" />
            <p className="ml-4 text-base">Continue with Google</p>
          </UiButton>
          <UiButton
            className="mt-4 h-12 w-full justify-start"
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
