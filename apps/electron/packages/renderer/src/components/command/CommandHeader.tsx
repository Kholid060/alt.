import { XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import CommandInput from './CommandInput';
import { useCommandStore } from '/@/stores/command.store';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';

function CommandBreadcrumb() {
  const [breadcrumbs, setCommandStore] = useCommandStore(
    useShallow((state) => [state.breadcrumbs, state.setState]),
  );

  const navigate = useCommandNavigate();

  function navigateBreadcrumb(index: number) {
    setCommandStore('breadcrumbs', breadcrumbs.slice(0, index));
    navigate(breadcrumbs[index].path);
  }
  function onBtnKeydown(event: React.KeyboardEvent, index: number) {
    if (event.repeat || breadcrumbs.length == 0) return;

    switch (event.code) {
      case 'Enter':
      case 'Backspace':
        event.stopPropagation();
        navigateBreadcrumb(index);
        break;
    }
  }

  return (
    <AnimatePresence>
      {breadcrumbs.length > 0 && (
        <motion.div
          layout
          key="breadcrumb"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="text-xs overflow-hidden"
        >
          <div className="px-4 pt-2 flex items-center gap-1">
            {breadcrumbs.map((item, index) => (
              <button
                type="button"
                key={item.path}
                onClick={() => navigateBreadcrumb(index)}
                onKeyDown={(event) => onBtnKeydown(event, index)}
                className="relative overflow-hidden group bg-secondary py-1 px-2 inline-flex items-center rounded-sm text-muted-foreground transition-colors focus-visible:outline-none focus-visible:bg-primary-hover/30"
              >
                {item.label}
                <span className="group-focus:visible group-hover:visible invisible h-full inline-flex pl-3 pr-1 items-center justify-center absolute top-0 right-0 bg-gradient-to-l from-60% from-secondary/80 to-transparent">
                  <XIcon className="h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CommandHeader() {
  return (
    <div className="py-1 border-b rounded-t-lg">
      <CommandBreadcrumb />
      <CommandInput />
    </div>
  );
}

export default CommandHeader;
