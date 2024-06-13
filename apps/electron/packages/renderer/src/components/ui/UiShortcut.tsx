import { memo } from 'react';
import { UiKbd } from '@alt-dot/ui';
import { COMMAND_MOD_NAME_MAP } from '../../utils/constant/constant';
import clsx from 'clsx';

interface UiShortcutProps {
  shortcut: string;
  className?: string;
  variant?: 'default' | 'text';
}

function UiShortcut({
  shortcut,
  className,
  variant = 'default',
}: UiShortcutProps) {
  const keys = shortcut.split('+');

  if (variant === 'text') {
    return (
      <span className={clsx('text-muted-foreground', className)}>
        {keys.map((key) => COMMAND_MOD_NAME_MAP[key] ?? key).join('+')}
      </span>
    );
  }

  return (
    <>
      {keys.map((key) => (
        <UiKbd key={key} className={className}>
          {COMMAND_MOD_NAME_MAP[key] ?? key}
        </UiKbd>
      ))}
    </>
  );
}

export default memo(UiShortcut);
