import { useIsFetching } from '@tanstack/react-query';
import { useNavigation } from 'react-router-dom';

/**
 * https://mui.com/material-ui/react-progress/#linear-indeterminate
 */

function AppLoadingIndicator() {
  const { state } = useNavigation();
  const isFetching = useIsFetching();

  const isLoading = state === 'loading' || isFetching > 0;

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

export default AppLoadingIndicator;
