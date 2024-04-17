import { memo } from 'react';
import { UiKbd } from '@repo/ui';
import { COMMAND_MOD_NAME_MAP } from '/@/utils/constant';

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
