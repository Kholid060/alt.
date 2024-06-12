import clsx from 'clsx';

function UiLogo({
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={clsx(
        'font-semibold leading-none cursor-default select-none',
        className,
      )}
      style={{ fontFeatureSettings: '"ss02"', ...(style ?? {}) }}
      {...props}
    >
      alt<span className="text-primary">.</span>
    </p>
  );
}

export default UiLogo;
