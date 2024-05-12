import { memo } from 'react';
import { UiKbd } from '@repo/ui';
import { COMMAND_MOD_NAME_MAP } from '../../utils/constant/constant';

interface UiShortcutProps {
  shortcut: string;
  variant?: 'default' | 'text';
}

function UiShortcut({ shortcut, variant = 'default' }: UiShortcutProps) {
  const keys = shortcut.split('+');

  if (variant === 'text') {
    return (
      <span className="text-muted-foreground">
        {keys.map((key) => COMMAND_MOD_NAME_MAP[key] ?? key).join('+')}
      </span>
    );
  }

  return (
    <>
      {keys.map((key) => (
        <UiKbd key={key}>{COMMAND_MOD_NAME_MAP[key] ?? key}</UiKbd>
      ))}
    </>
  );
}

export default memo(UiShortcut);
