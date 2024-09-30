import { useAppStore } from '@/stores/app.store';
import { UiLogo } from '@altdot/ui';
import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import { MoveUpRightIcon } from 'lucide-react';

interface LinkItem {
  url: string;
  label: string;
  isExternal?: boolean;
}

function FooterLinks({ items, title }: { title: string; items: LinkItem[] }) {
  return (
    <div className="space-y-2">
      <p className="mb-4 font-semibold text-foreground">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.url}>
            {item.isExternal ? (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {item.label}
                <MoveUpRightIcon className="ml-1 inline size-3 align-middle" />
              </a>
            ) : (
              <Link
                resetScroll
                to={item.url}
                className="transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AppFooter({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const hideFooter = useAppStore((state) => state.hideFooter);

  if (hideFooter) return null;

  return (
    <footer className={clsx('min-h-96 border-t', className)} {...props}>
      <div className="container grid grid-cols-1 gap-y-12 py-12 text-muted-foreground md:grid-cols-3">
        <UiLogo className="text-3xl text-foreground" />
        <FooterLinks
          items={[
            {
              label: 'Store',
              url: '/store',
            },
            {
              isExternal: true,
              label: 'Documentation',
              url: 'https://docs.altdot.app',
            },
          ]}
          title="Resources"
        />
        <FooterLinks
          items={[
            {
              isExternal: true,
              label: 'GitHub',
              url: 'https://github.com/kholid060/alt.',
            },
          ]}
          title="Community"
        />
      </div>
    </footer>
  );
}

export default AppFooter;
