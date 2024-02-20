import { UiCommandInput } from '@repo/ui';
import { SearchIcon, XIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useCommandStore } from '/@/stores/command.store';

function CommandInput() {
  const [query, setState] = useCommandStore((state) => [state.query, state.setState]);

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (
      event.code !== 'Backspace' ||
      (event.target as HTMLInputElement).value.trim().length !== 0
    ) return;

    let { paths } = useCommandStore.getState();
    if (paths.length === 0) return;

    paths = [...paths];
    paths.pop();

    setState('paths', paths);
  }

  return (
    <UiCommandInput
      value={query}
      onValueChange={(value) => setState('query', value)}
      placeholder="Search..."
      rootClass="px-4 border-b-0"
      className="text-base pl-0.5 py-0"
      onKeyDown={onKeyDown}
      iconSlot={
        <span className="h-8 w-8 inline-flex items-center justify-center mr-2">
          <SearchIcon className="h-5 w-5 text-muted-foreground opacity-75" />
        </span>
      }
    />
  );
}

function CommandBreadcrumb() {
  const [paths, setStoreState] = useCommandStore((state) => [
    state.paths,
    state.setState,
  ]);

  function onBtnKeydown(event: React.KeyboardEvent, index: number) {
    if (event.repeat || paths.length == 0) return;

    switch (event.code) {
      case 'Enter':
      case 'Backspace':
        event.stopPropagation();
        setStoreState('paths', paths.slice(0, index));
        break;
    }
  }

  return (
    <AnimatePresence>
      {paths.length > 0 &&
        <motion.div
          layout
          key="breadcrumb"
          initial={{ height: 0 }}
          animate={{ height: 'auto' }}
          exit={{ height: 0 }}
          className="text-xs overflow-hidden"
        >
          <div className="px-4 pt-2 flex items-center gap-1">
            {paths.map((path, index) =>
              <button
                type="button"
                key={path.id + index}
                onKeyDown={(event) => onBtnKeydown(event, index)}
                onClick={() => setStoreState('paths', paths.slice(0, index))}
                className="relative overflow-hidden group bg-secondary py-1 px-2 inline-flex items-center rounded-sm text-muted-foreground transition-colors focus-visible:outline-none focus-visible:bg-primary-hover/30"
              >
                {path.label}
                <span className="group-focus:visible group-hover:visible invisible h-full inline-flex pl-3 pr-1 items-center justify-center absolute top-0 right-0 bg-gradient-to-l from-60% from-secondary/80 to-transparent">
                  <XIcon className="h-4 w-4" />
                </span>
              </button>
            )}
          </div>
        </motion.div>
      }
    </AnimatePresence>
  );
}

function CommandHeader() {
  return (
    <div className="py-1 border-b">
      <CommandBreadcrumb />
      <CommandInput />
    </div>
  );
}

export default CommandHeader;
