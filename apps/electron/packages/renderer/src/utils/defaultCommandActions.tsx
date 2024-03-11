import { UiListItem, UiList } from '@repo/ui';
import { ClipboardPaste, CopyIcon, GlobeIcon } from 'lucide-react';
import {
  CommandActionCustom,
  CommandActions,
} from '../interface/command.interface';

type CommandActionType = Exclude<CommandActions, CommandActionCustom>['type'];

const defaultCommandActions: Record<
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

export default defaultCommandActions;
