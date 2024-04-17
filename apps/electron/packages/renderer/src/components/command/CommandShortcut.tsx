import { memo } from 'react';
import { IS_MAC_OS } from '/@/utils/constant';
import { UiKbd } from '@repo/ui';

const COMMAND_MOD_NAME_MAP: Record<string, string> = {
  CmdOrCtrl: IS_MAC_OS ? '⌘' : 'Ctrl',
};

function CommandShortcut({ shortcut }: { shortcut: string }) {
  const keys = shortcut.split('+');

  return (
    <>
      {keys.map((key) => (
        <UiKbd key={key}>{COMMAND_MOD_NAME_MAP[key] ?? key}</UiKbd>
      ))}
    </>
  );
}

export default memo(CommandShortcut);
