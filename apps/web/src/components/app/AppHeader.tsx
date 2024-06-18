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
  UiSkeleton,
} from '@alt-dot/ui';
import {
  CodeIcon,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  UserRoundIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useShallow } from 'zustand/react/shallow';

function AppHeader() {
  const [profile, userState] = useUserStore(
    useShallow((state) => [state.profile, state.state]),
  );

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      <div className="container">
        <nav className="h-14 mt-4 mx-auto border rounded-md px-4 items-center grid grid-cols-12 bg-background/70 backdrop-blur-sm">
          <div className="col-span-2">
            <Link to="/">
              <UiLogo className="text-2xl cursor-pointer inline-block" />
            </Link>
          </div>
          <div className="col-span-8 text-center">
            <UiButton variant="ghost" size="sm">
              Store
            </UiButton>
          </div>
          <div className="col-span-2 flex justify-end items-center">
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
                      <UiDropdownMenuItem asChild>
                        <Link to={`/u/${profile.username}`}>
                          <UserRoundIcon className="size-4 mr-2" />
                          Profile
                        </Link>
                      </UiDropdownMenuItem>
                    )}
                    <UiDropdownMenuItem asChild>
                      <Link to="/devconsole/extensions">
                        <CodeIcon className="size-4 mr-2" />
                        Developer dashboard
                      </Link>
                    </UiDropdownMenuItem>
                  </UiDropdownMenuGroup>
                  <UiDropdownMenuSeparator />
                  <UiDropdownMenuGroup>
                    <UiDropdownMenuItem asChild>
                      <Link to="/settings/profile">
                        <SettingsIcon className="size-4 mr-2" />
                        Settings
                      </Link>
                    </UiDropdownMenuItem>
                  </UiDropdownMenuGroup>
                  <UiDropdownMenuSeparator />
                  <UiDropdownMenuItem
                    variant="destructive"
                    onClick={() =>
                      SupabaseService.instance.client.auth.signOut()
                    }
                  >
                    <LogOutIcon className="size-4 mr-2" />
                    Log out
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            ) : userState === 'fetching' ? (
              <UiSkeleton className="size-9 rounded-full border" />
            ) : (
              <Link to="/auth">
                <UiButton size="sm" variant="secondary">
                  <LogInIcon className="size-4 mr-2 -ml-1" />
                  Log in
                </UiButton>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;
