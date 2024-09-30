import { useAppStore } from '@/stores/app.store';
import { useEffect } from 'react';

export function useHideFooter() {
  useEffect(() => {
    const { setHideFooter } = useAppStore.getState();
    setHideFooter(true);

    return () => {
      setHideFooter(false);
    };
  }, []);
}
