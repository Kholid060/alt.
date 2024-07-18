import { UiIcons, UiImage } from '@altdot/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2Icon } from 'lucide-react';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useCommandStore } from '/@/stores/command.store';

function CommandHeaderPanel() {
  const header = useCommandPanelStore((state) => state.header);

  let headerIcon: React.ReactNode = header?.icon ?? null;
  if (header?.icon && typeof header.icon === 'string') {
    if (header.icon.startsWith('icon:')) {
      let iconName = header.icon.slice('icon:'.length) as keyof typeof UiIcons;
      iconName = UiIcons[iconName] ? iconName : 'Command';

      const Icon = UiIcons[iconName] ?? header.icon;
      headerIcon = <Icon className="mr-2 h-5 w-5" />;
    } else {
      headerIcon = (
        <UiImage
          className="mr-2 h-6 w-6 object-cover"
          src={header.icon}
          alt={`${header.title} icon`}
        />
      );
    }
  }

  return (
    <AnimatePresence>
      {header && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
          className="flex min-h-9 min-w-24 items-center rounded-md border bg-background px-3 text-sm"
        >
          {headerIcon}
          <p className="line-clamp-1 leading-tight">{header.title}</p>
          <p className="ml-3 line-clamp-1 text-xs leading-tight text-muted-foreground">
            {header.subtitle}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommandStatusPanel() {
  const status = useCommandPanelStore((state) => state.status.at(-1));

  let indicator: React.ReactNode = null;
  if (status?.type) {
    switch (status.type) {
      case 'loading':
        indicator = (
          <span className="mr-2">
            <Loader2Icon className="h-5 w-5 animate-spin" />
          </span>
        );
        break;
      case 'success':
        indicator = (
          <span className="relative mr-2 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-500"></span>
          </span>
        );

        break;
      case 'error':
        indicator = (
          <span className="relative mr-2 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
          </span>
        );
        break;
    }
  }

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
          className="flex min-h-9 min-w-24 items-center rounded-md border bg-background px-3 py-1.5 text-sm"
        >
          {indicator}
          <div>
            <p className="line-clamp-1 leading-tight">{status.title}</p>
            <p className="line-clamp-2 text-xs leading-tight text-muted-foreground">
              {status.description}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommandFooter() {
  const isWindowHidden = useCommandStore.use.isWindowHidden();

  if (isWindowHidden) return null;

  return (
    <div className="mt-2 flex items-start gap-2">
      <CommandHeaderPanel />
      <div className="flex-grow"></div>
      <CommandStatusPanel />
    </div>
  );
}

export default CommandFooter;
