import {
  UiToast,
  UiToastClose,
  UiToastDescription,
  ToastProvider,
  UiToastTitle,
  UiToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/hooks/useToast';

export function UiToaster({ viewportClass }: { viewportClass?: string }) {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <UiToast key={id} {...props}>
            <div className="grid gap-1">
              {title && <UiToastTitle>{title}</UiToastTitle>}
              {description && (
                <UiToastDescription>{description}</UiToastDescription>
              )}
            </div>
            {action}
            <UiToastClose />
          </UiToast>
        );
      })}
      <UiToastViewport className={viewportClass} />
    </ToastProvider>
  );
}
