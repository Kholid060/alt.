import {
  UiPopover,
  UiPopoverTrigger,
  UiKbd,
  UiPopoverContent,
  UiScrollArea,
  UiScrollBar,
  UiList,
  UiListItem,
} from '@repo/ui';
import {
  UiListProvider,
  useUiListStore,
} from '@repo/ui/dist/context/list.context';
import { useEffect, useRef, useState } from 'react';
import { HotkeysProvider, useHotkeys } from 'react-hotkeys-hook';
import { useCommandStore } from '/@/stores/command.store';
import {
  CommandActionCustom,
  CommandActions as CommandActionsType,
} from '/@/interface/command.interface';
import { ClipboardPaste, CopyIcon, GlobeIcon } from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';
import hotkeys from 'hotkeys-js';

type CommandActionType = Exclude<
  CommandActionsType,
  CommandActionCustom
>['type'];

const actionsDefaultValue: Record<
  CommandActionType,
  Pick<UiListItem, 'title' | 'icon'>
> = {
  copy: {
    title: 'Copy to Clipboard',
    icon: <UiList.Icon icon={CopyIcon} />,
  },
  paste: {
    title: 'Paste Content',
    icon: <UiList.Icon icon={ClipboardPaste} />,
  },
  'open-url': {
    title: 'Open in Browser',
    icon: <UiList.Icon icon={GlobeIcon} />,
  },
  'show-in-folder': {
    title: 'Show in Folder',
    icon: <UiList.Icon icon={GlobeIcon} />,
  },
  'move-to-trash': {
    title: 'Show in Folder',
    icon: <UiList.Icon icon={GlobeIcon} />,
  },
};
const actionsHandler = {
  copy: (content: string) => () =>
    preloadAPI.main.sendIpcMessage('clipboard:copy', content),
  paste: (content: string) => () =>
    preloadAPI.main.sendIpcMessage('clipboard:paste', content),
  'open-url': (url: string) => () =>
    preloadAPI.main.sendIpcMessage('shell:open-url', url),
  'show-in-folder': (path: string) => () =>
    preloadAPI.main.sendIpcMessage('shell:open-in-folder', path),
  'move-to-trash': (path: string) => () =>
    preloadAPI.main.sendIpcMessage('shell:move-to-trash', path),
};

function CommandActionsContent() {
  const lastFocusEl = useRef<HTMLElement | null>(null);

  const listStore = useUiListStore();
  const actions = useCommandStore((state) => state.actions);

  const [open, setOpen] = useState(false);

  const items: UiListItem[] = actions.map((item, index) => {
    const actionValue =
      item.type === 'custom'
        ? { title: item.title, icon: item.icon }
        : actionsDefaultValue[item.type];

    const listItem: UiListItem = {
      value: item.type + index,
      suffix: (
        <>
          {item.shortcut.split('+').map((key) => (
            <UiKbd key={key}>{key}</UiKbd>
          ))}
        </>
      ),
      ...actionValue,
    };

    // switch (item.type) {
    //   case 'copy':
    //   case 'paste':
    //     listItem.onSelected = () => actionsHandler[item.type](item.content);
    //     break;
    //   case 'move-to-trash':
    //   case 'show-in-folder':
    //     listItem.onSelected = () => actionsHandler[item.type](item.path);
    //     break;
    //   case 'open-url':
    //     listItem.onSelected = () => actionsHandler[item.type](item.url);
    //     break;
    //   case 'custom':
    //     listItem.onSelected = () => item.callback();
    //     break;
    // }

    return listItem;
  });

  useEffect(() => {
    hotkeys('alt+a', () => setOpen((prevVal) => !prevVal));

    return () => {
      hotkeys.unbind('alt+a');
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="p-1 bg-background rounded-lg border text-muted-foreground">
      <UiPopover open={open} onOpenChange={setOpen}>
        <UiPopoverTrigger className="px-2 h-9 transition-colors hover:bg-card rounded-sm focus:outline-none focus:bg-card">
          <span className="mr-1">Actions</span>
          <UiKbd>Alt</UiKbd>
          <UiKbd>A</UiKbd>
        </UiPopoverTrigger>
        <UiPopoverContent
          align="end"
          side="top"
          onOpenAutoFocus={() => {
            if (document.activeElement instanceof HTMLElement) {
              lastFocusEl.current = document.activeElement;
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            lastFocusEl.current?.focus();
          }}
          className="p-0 w-64 text-sm"
          sideOffset={14}
          onKeyDown={(event) => {
            listStore.listControllerKeyBind(event.nativeEvent);
          }}
        >
          <p className="p-2 text-muted-foreground">Actions</p>
          <UiScrollArea className="h-48 px-2 pb-2">
            <UiScrollBar />
            <UiList
              items={items}
              renderItem={({ item, props, selected, ref }) => (
                <UiList.Item
                  ref={ref}
                  selected={selected}
                  {...item}
                  {...props}
                />
              )}
              className="h-full"
            ></UiList>
          </UiScrollArea>
        </UiPopoverContent>
      </UiPopover>
    </div>
  );
}

function CommandActions() {
  return (
    <UiListProvider>
      <HotkeysProvider initiallyActiveScopes={['actions']}>
        <CommandActionsContent />
      </HotkeysProvider>
    </UiListProvider>
  );
}

export default CommandActions;
