import { UiSkeleton } from '@alt-dot/ui';
import { useIsFetching } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

/**
 * https://mui.com/material-ui/react-progress/#linear-indeterminate
 */

function AppLoadingIndicator() {
  const router = useRouter();
  const isFetching = useIsFetching();

  const isLoading = isFetching || router.state.isLoading;

  return (
    <div
      className="fixed top-0 z-[999] w-full h-1 bg-primary/20"
      style={
        {
          height: isLoading ? 4 : 0,
          transition: 'height 150ms ease',
          '--play': isLoading ? 'running' : 'unset',
        } as React.CSSProperties
      }
    >
      <span
        className="bg-primary/60 absolute h-full bottom-0 left-0 top-0"
        style={{
          width: 'auto',
          transformOrigin: 'left center',
          transition: 'transform 0.2s linear 0s',
          animation:
            '2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) 0s infinite normal none var(--play) animation-progress-1',
        }}
      />
      <span
        style={{
          width: 'auto',
          transformOrigin: 'left center',
          transition: 'transform 0.2s linear 0s',
          animation:
            '2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite normal none var(--play) animation-progress-2',
        }}
        className="bg-primary/60 h-full left-0 top-0 bottom-0 absolute"
      />
    </div>
  );
}

export function AppLoadingPlaceholder() {
  return (
    <div className="container">
      <UiSkeleton className="h-12 mt-4" />
      <UiSkeleton className="h-8 mt-24 max-w-sm" />
      <div className="flex flex-col md:flex-row mt-4 gap-4">
        <UiSkeleton className="h-48 w-full md:w-64" />
        <UiSkeleton className="h-48 flex-1" />
      </div>
      <UiSkeleton className="h-64 w-full mt-4" />
    </div>
  );
}

export default AppLoadingIndicator;
