import { useRef } from 'react';

export function useLazyRef<T>(fn: () => T) {
  const ref = useRef<T>();

  if (ref.current === undefined) {
    ref.current = fn();
  }

  return ref as React.MutableRefObject<T>;
}
