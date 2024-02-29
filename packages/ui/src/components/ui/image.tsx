import { forwardRef, useRef } from 'react';

export const UiImage = forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement> & { fallbackSrc?: string }
>(({ alt, fallbackSrc, ...props }, ref) => {
  const usingFallback = useRef(false);

  return (
    <img
      {...props}
      ref={ref}
      alt={alt}
      onError={(event) => {
        props.onError?.(event);

        if (!fallbackSrc || usingFallback.current) return;

        usingFallback.current = true;
        (event.target as HTMLImageElement).src = fallbackSrc;
      }}
    />
  );
});
UiImage.displayName = 'UiImage';
