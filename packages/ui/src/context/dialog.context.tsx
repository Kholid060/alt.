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
  okButtonVariant?: 'default' | 'destructive';
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

type DialogComponent<T extends Dialogs> = React.FC<T & { onClose(): void }>;

const DialogConfirm: DialogComponent<DialogConfirm> = ({
  options,
  resolver,
  onClose,
}) => {
  return (
    <UiAlertDialog
      defaultOpen={true}
      onOpenChange={() => {
        resolver.resolve(false);
        onClose();
      }}
    >
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>{options.title}</UiAlertDialogTitle>
          <UiAlertDialogDescription>{options.body}</UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter className="mt-4">
          <UiAlertDialogCancel>
            {options.cancelText || 'Cancel'}
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            variant={options.okButtonVariant}
            onClick={() => {
              resolver.resolve(true);
              onClose();
            }}
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
const DialogContainer = forwardRef<DialogContainerRef>((_props, ref) => {
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
    setDialogs(dialogs.filter((dialog) => dialog.id !== id));
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

export function DialogProvider({ children }: { children?: React.ReactNode }) {
  const dialogId = useRef(0);
  const containerRef = useRef<DialogContainerRef>(null);

  function confirm(options: DialogConfirmOptions = {}) {
    if (!containerRef.current) return Promise.resolve(false);

    dialogId.current += 1;

    const resolver = Promise.withResolvers<boolean>();
    containerRef.current.addDialog({
      options,
      resolver,
      type: 'confirm',
      id: dialogId.current,
    });

    return resolver.promise;
  }

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
      <DialogContainer ref={containerRef} />
    </DialogContext.Provider>
  );
}
