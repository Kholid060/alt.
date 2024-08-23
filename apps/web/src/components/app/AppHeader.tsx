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
  UiTooltip,
} from '@altdot/ui';
import { Link } from '@tanstack/react-router';
import {
  CodeIcon,
  LogInIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  UserRoundCogIcon,
  UserRoundIcon,
  XIcon,
} from 'lucide-react';
import githubWhiteSvg from '@/assets/logo/github-white.svg';
import { useEffect, useState } from 'react';

function ProfileMenu() {
  const profile = useUserStore.use.profile();

  return (
    <>
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
              onClick={() => SupabaseService.instance.client.auth.signOut()}
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
    </>
  );
}

const HEADER_LINKS: { name: string; url: string; isExternal?: boolean }[] = [
  { name: 'Store', url: '/store' },
  { name: 'Documentation', url: '/store', isExternal: true },
];

function HeaderLinkMobile() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const queryChanged = (event: MediaQueryListEvent) => {
      if (event.matches) setIsOpen(false);
    };
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    mediaQuery.addEventListener('change', queryChanged);

    return () => {
      mediaQuery.removeEventListener('change', queryChanged);
    };
  }, []);

  return (
    <UiDropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <UiDropdownMenuTrigger asChild>
        <UiButton
          variant="secondary"
          size="icon-sm"
          className="mr-2 md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? (
            <XIcon className="size-5" />
          ) : (
            <MenuIcon className="size-5" />
          )}
        </UiButton>
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent className="w-48 md:hidden" align="end">
        {[
          ...HEADER_LINKS,
          { name: 'GitHub', url: 'https://github.com', isExternal: true },
        ].map((item) => (
          <UiDropdownMenuItem key={item.name} asChild>
            {item.isExternal ? (
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.name}
              </a>
            ) : (
              <Link to={item.url}>{item.name}</Link>
            )}
          </UiDropdownMenuItem>
        ))}
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  );
}

function AppHeader() {
  return (
    <header className="fixed left-0 top-0 z-[49] w-full">
      <div className="container">
        <nav className="mx-auto mt-4 grid h-14 grid-cols-12 items-center rounded-md border bg-background/70 px-4 backdrop-blur-sm">
          <div className="col-span-6 md:col-span-2">
            <Link to="/">
              <UiLogo className="inline-block cursor-pointer text-2xl" />
            </Link>
          </div>
          <div className="col-span-8 hidden space-x-2 text-center md:block">
            {HEADER_LINKS.map((item) => (
              <UiButton key={item.name} variant="ghost" size="sm" asChild>
                {item.isExternal ? (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    {item.name}
                  </a>
                ) : (
                  <Link to={item.url}>{item.name}</Link>
                )}
              </UiButton>
            ))}
          </div>
          <div className="col-span-6 flex items-center justify-end md:col-span-2">
            <UiTooltip label="Alt. GitHub repository">
              <a
                href="https://github.com"
                target="_blank"
                className="mr-4 hidden md:block"
                rel="noreferrer"
              >
                <img
                  src={githubWhiteSvg}
                  className="size-5"
                  alt="github logo"
                />
              </a>
            </UiTooltip>
            <HeaderLinkMobile />
            <ProfileMenu />
          </div>
        </nav>
      </div>
    </header>
  );
}

export default AppHeader;
