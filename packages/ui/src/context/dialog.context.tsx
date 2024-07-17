import {
  UiAlertDialog,
  UiAlertDialogAction,
  UiAlertDialogCancel,
  UiAlertDialogContent,
  UiAlertDialogDescription,
  UiAlertDialogFooter,
  UiAlertDialogHeader,
  UiAlertDialogTitle,
} from '@/components/ui/alert-dialog';
import clsx from 'clsx';
import {
  createContext,
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

export interface DialogConfirmOptions {
  okText?: string;
  cancelText?: string;
  body?: string | React.ReactNode;
  title?: string | React.ReactNode;
  okButtonVariant?: 'default' | 'destructive' | 'secondary';
  containerEl?: React.RefObject<Element> | Element | null;
  class?: {
    title?: string;
    okBtn?: string;
    header?: string;
    footer?: string;
    overlay?: string;
    content?: string;
    cancelBtn?: string;
    description?: string;
  };
}

interface DialogProviderOptions {
  onAllClosed?: () => void;
  onCloseAutoFocus?: (event: Event) => void;
  onDialogAdded?: (dialog: DialogConfirmOptions) => void;
}

interface DialogConfirm {
  id: number;
  type: 'confirm';
  options: DialogConfirmOptions;
  resolver: PromiseWithResolvers<boolean>;
}

type Dialogs = DialogConfirm;

interface DialogContextState {
  confirm(options?: DialogConfirmOptions): Promise<boolean>;
}
// @ts-expect-error throw error if not inside the context
const DialogContext = createContext<DialogContextState>();

type DialogComponent<T extends Dialogs> = React.FC<
  T & { onClose(): void; providerOptions: DialogProviderOptions }
>;

const DialogConfirm: DialogComponent<DialogConfirm> = ({
  options,
  onClose,
  resolver,
  providerOptions,
}) => {
  const container =
    options.containerEl && 'current' in options.containerEl
      ? options.containerEl.current
      : options.containerEl;

  return (
    <UiAlertDialog
      defaultOpen={true}
      onOpenChange={() => {
        resolver.resolve(false);
        onClose();
      }}
    >
      <UiAlertDialogContent
        container={container}
        className={options.class?.content}
        overlayClass={options.class?.overlay}
        onCloseAutoFocus={providerOptions.onCloseAutoFocus}
      >
        <UiAlertDialogHeader className={options.class?.header}>
          <UiAlertDialogTitle className={options.class?.title}>
            {options.title}
          </UiAlertDialogTitle>
          <UiAlertDialogDescription className={options.class?.description}>
            {options.body}
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter className={clsx('mt-4', options.class?.footer)}>
          <UiAlertDialogCancel className={options.class?.cancelBtn}>
            {options.cancelText || 'Cancel'}
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            variant={options.okButtonVariant}
            onClick={() => {
              resolver.resolve(true);
              onClose();
            }}
            className={options.class?.okBtn}
          >
            {options.okText || 'Confirm'}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  );
};

interface DialogContainerRef {
  addDialog(dialog: Dialogs): void;
}
const DialogContainer = forwardRef<
  DialogContainerRef,
  { providerOptions: DialogProviderOptions }
>(({ providerOptions }, ref) => {
  const [dialogs, setDialogs] = useState<Dialogs[]>([]);

  useImperativeHandle(
    ref,
    () => {
      return {
        addDialog(dialog) {
          setDialogs((prevVal) => [...prevVal, dialog]);
        },
      };
    },
    [],
  );

  function deleteDialog(id: number) {
    const filteredDialogs = dialogs.filter((dialog) => dialog.id !== id);
    setDialogs(filteredDialogs);

    if (filteredDialogs.length === 0) {
      providerOptions.onAllClosed?.();
    }
  }

  return (
    <>
      {dialogs.map((dialog) => {
        switch (dialog.type) {
          case 'confirm':
            return (
              <DialogConfirm
                key={dialog.id}
                {...dialog}
                providerOptions={providerOptions}
                onClose={() => deleteDialog(dialog.id)}
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
});
DialogContainer.displayName = 'DialogContainer';

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error(
      'The component must be wrapped inside "DialogProvider" before using "useDialog"',
    );
  }

  return {
    confirm: context.confirm,
  };
}

export function DialogProvider({
  children,
  dialogOptions = {},
  options: providerOptions = {},
}: {
  children?: React.ReactNode;
  options?: DialogProviderOptions;
  dialogOptions?: DialogConfirmOptions;
}) {
  const dialogId = useRef(0);
  const containerRef = useRef<DialogContainerRef>(null);

  function confirm(options: DialogConfirmOptions = {}) {
    if (!containerRef.current) return Promise.resolve(false);

    dialogId.current += 1;

    const resolver = Promise.withResolvers<boolean>();
    const mergedOptions: DialogConfirmOptions = {
      ...dialogOptions,
      ...options,
      class: { ...(dialogOptions.class ?? {}), ...(options.class ?? {}) },
    };
    containerRef.current.addDialog({
      resolver,
      type: 'confirm',
      id: dialogId.current,
      options: mergedOptions,
    });

    providerOptions.onDialogAdded?.(options);

    return resolver.promise;
  }

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
      <DialogContainer ref={containerRef} providerOptions={providerOptions} />
    </DialogContext.Provider>
  );
}
