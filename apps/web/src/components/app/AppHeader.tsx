import SupabaseService from '@/services/supabase.service';
import { useUserStore } from '@/stores/user.store';
import { UserRole } from '@/utils/constant';
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
} from '@altdot/ui';
import { Link } from '@tanstack/react-router';
import {
  CodeIcon,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  UserRoundCogIcon,
  UserRoundIcon,
} from 'lucide-react';

function AppHeader() {
  const profile = useUserStore.use.profile();

  return (
    <header className="fixed left-0 top-0 z-[49] w-full">
      <div className="container">
        <nav className="mx-auto mt-4 grid h-14 grid-cols-12 items-center rounded-md border bg-background/70 px-4 backdrop-blur-sm">
          <div className="col-span-2">
            <Link to="/">
              <UiLogo className="inline-block cursor-pointer text-2xl" />
            </Link>
          </div>
          <div className="col-span-8 text-center">
            <UiButton variant="ghost" size="sm" asChild>
              <Link to="/store">Store</Link>
            </UiButton>
          </div>
          <div className="col-span-2 flex items-center justify-end">
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
                <UiDropdownMenuContent
                  className="w-56"
                  align="end"
                  style={{ zIndex: 150 }}
                >
                  <div className="mb-2 px-3 pt-1 text-sm">
                    <p className="line-clamp-1 font-semibold leading-tight">
                      {profile.name}
                    </p>
                    <p className="line-clamp-1 leading-tight text-muted-foreground">
                      {profile.username || '-'}
                    </p>
                  </div>
                  <UiDropdownMenuGroup>
                    {profile.username && (
                      <UiDropdownMenuItem asChild>
                        <Link to={`/u/${profile.username}`}>
                          <UserRoundIcon className="mr-2 size-4" />
                          Profile
                        </Link>
                      </UiDropdownMenuItem>
                    )}
                    <UiDropdownMenuItem asChild>
                      <Link to="/devconsole/extensions">
                        <CodeIcon className="mr-2 size-4" />
                        Developer dashboard
                      </Link>
                    </UiDropdownMenuItem>
                    {profile.role === UserRole.Admin && (
                      <UiDropdownMenuItem asChild>
                        <Link to="/admin/dashboard">
                          <UserRoundCogIcon className="mr-2 size-4" />
                          Admin dashboard
                        </Link>
                      </UiDropdownMenuItem>
                    )}
                  </UiDropdownMenuGroup>
                  <UiDropdownMenuSeparator />
                  <UiDropdownMenuGroup>
                    <UiDropdownMenuItem asChild>
                      <Link to="/settings/profile">
                        <SettingsIcon className="mr-2 size-4" />
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
                    <LogOutIcon className="mr-2 size-4" />
                    Log out
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            ) : (
              <Link to="/auth">
                <UiButton size="sm" variant="secondary">
                  <LogInIcon className="-ml-1 mr-2 size-4" />
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
