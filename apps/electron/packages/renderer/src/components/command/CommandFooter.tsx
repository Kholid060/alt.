import { UiImage } from '@repo/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { commandIcons } from '#common/utils/command-icons';
import { Loader2Icon } from 'lucide-react';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useCommandStore } from '/@/stores/command.store';

function CommandHeaderPanel() {
  const header = useCommandPanelStore((state) => state.header);

  let headerIcon: React.ReactNode = null;
  if (header?.icon) {
    if (header.icon.startsWith('icon:')) {
      let iconName = header.icon.slice(
        'icon:'.length,
      ) as keyof typeof commandIcons;
      iconName = commandIcons[iconName] ? iconName : 'Command';

      const Icon = commandIcons[iconName] ?? header.icon;
      headerIcon = <Icon className="w-5 h-5 mr-2" />;
    } else {
      headerIcon = (
        <UiImage
          className="h-6 w-6 object-cover mr-2"
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
          className="flex items-center bg-background rounded-md border px-3 text-sm min-w-24 min-h-9"
        >
          {headerIcon}
          <p className="leading-tight line-clamp-1">{header.title}</p>
          <p className="text-xs ml-3 line-clamp-1 text-muted-foreground leading-tight">
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
            <Loader2Icon className="animate-spin h-5 w-5" />
          </span>
        );
        break;
      case 'success':
        indicator = (
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
          </span>
        );

        break;
      case 'error':
        indicator = (
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
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
          className="flex items-center bg-background rounded-md border px-3 text-sm py-1.5 min-w-24 min-h-9"
        >
          {indicator}
          <div>
            <p className="leading-tight line-clamp-1">{status.title}</p>
            <p className="leading-tight line-clamp-1 text-xs text-muted-foreground">
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
    <div className="flex items-start gap-2 mt-2">
      <CommandHeaderPanel />
      <div className="flex-grow"></div>
      <CommandStatusPanel />
    </div>
  );
}

export default CommandFooter;
