import { useRef } from 'react';

function UiImage({
  fallbackSrc, ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { fallbackSrc?: string }) {
  const usingFallback = useRef(false);

  return (
    <img
      {...props}
      onError={(event) => {
        props.onError?.(event);

        if (!fallbackSrc || usingFallback.current) return;

        usingFallback.current = true;
        (event.target as HTMLImageElement).src = fallbackSrc;
      }}
    />
  )
}

export default UiImage;
