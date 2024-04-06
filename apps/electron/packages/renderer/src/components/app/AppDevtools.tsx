import { UiButton, UiTooltip } from '@repo/ui';
import { GripHorizontalIcon, AppWindowIcon, LockIcon } from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';

function AppDevtools() {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="flex items-center gap-2 mb-2">
      <UiButton
        size="icon"
        variant="secondary"
        className="cursor-move"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <GripHorizontalIcon className="h-5 w-5" />
      </UiButton>
      <UiTooltip label="Open devtools">
        <UiButton
          size="icon"
          variant="secondary"
          onClick={() => {
            preloadAPI.main.invokeIpcMessage('app:open-devtools');
          }}
        >
          <AppWindowIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
      <UiTooltip label="Toggle lock window">
        <UiButton
          size="icon"
          variant="secondary"
          onClick={() => {
            preloadAPI.main.invokeIpcMessage('app:toggle-lock-window');
          }}
        >
          <LockIcon className="h-5 w-5" />
        </UiButton>
      </UiTooltip>
    </div>
  );
}

export default AppDevtools;
