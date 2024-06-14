import SupabaseService from '@/services/supabase.service';
import { useUserStore } from '@/stores/user.store';
import {
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiButton,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuGroup,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
  UiDropdownMenuTrigger,
  UiLogo,
} from '@alt-dot/ui';
import {
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  UserRoundIcon,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

function AppHeader() {
  const profile = useUserStore.use.profile();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <nav className="h-14 mt-4 mx-auto container border rounded-md px-4 flex items-center bg-background/70 backdrop-blur-sm">
        <Link to="/">
          <UiLogo className="text-3xl cursor-pointer" />
        </Link>
        <div className="flex grow"></div>
        {profile ? (
          <UiDropdownMenu>
            <UiDropdownMenuTrigger className="rounded-full">
              <UiAvatar className="size-9 border-2">
                <UiAvatarImage
                  src={profile.avatarUrl ?? undefined}
                  alt={profile.name}
                />
                <UiAvatarFallback>
                  <UserRoundIcon className="size-5" />
                </UiAvatarFallback>
              </UiAvatar>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent className="w-56" align="end">
              <div className="text-sm mb-2 px-3  pt-1">
                <p className="line-clamp-1 font-semibold leading-tight">
                  {profile.name}
                </p>
                <p className="text-muted-foreground leading-tight line-clamp-1">
                  {profile.username || '-'}
                </p>
              </div>
              <UiDropdownMenuGroup>
                {profile.username && (
                  <UiDropdownMenuItem
                    onClick={() => navigate(`/u/${profile.username}`)}
                  >
                    <UserRoundIcon className="size-4 mr-2" />
                    Profile
                  </UiDropdownMenuItem>
                )}
                <UiDropdownMenuItem
                  onClick={() => navigate('/settings/profile')}
                >
                  <SettingsIcon className="size-4 mr-2" />
                  Settings
                </UiDropdownMenuItem>
              </UiDropdownMenuGroup>
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem
                variant="destructive"
                onClick={() => SupabaseService.instance.client.auth.signOut()}
              >
                <LogOutIcon className="size-4 mr-2" />
                Log out
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        ) : (
          <Link to="/auth">
            <UiButton size="sm" variant="secondary">
              <LogInIcon className="size-5 mr-2 -ml-1" />
              Log in
            </UiButton>
          </Link>
        )}
      </nav>
    </header>
  );
}

export default AppHeader;
