import { UiButton } from '@repo/ui';
import { GripHorizontalIcon } from 'lucide-react';

function CommandFooter() {
  return (
    <div className="flex items-center gap-4 mt-1 text-sm">
      {import.meta.env.DEV && (
        <div className="flex items-center gap-2">
          <UiButton
            size="icon"
            variant="secondary"
            className="mb-2 cursor-move"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
          >
            <GripHorizontalIcon className="h-5 w-5" />
          </UiButton>
        </div>
      )}
      <div className="flex-grow"></div>
    </div>
  );
}

export default CommandFooter;
