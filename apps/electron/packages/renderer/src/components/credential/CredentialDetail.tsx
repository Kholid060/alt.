import { ExtensionCredential } from '@repo/extension-core/src/client/manifest/manifest-credential';
import {
  UiLabel,
  UiInput,
  UiForm,
  UiFormField,
  UiFormItem,
  UiFormControl,
  UiFormLabel,
  UiFormMessage,
  UiButton,
  useToast,
} from '@repo/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2Icon } from 'lucide-react';
import { useState } from 'react';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';

type CredentialProps = Omit<
  React.FormHTMLAttributes<HTMLFormElement>,
  'onSubmit'
> &
  Pick<CredentialDetailProps, 'extension' | 'credential'> & {
    isEditing?: boolean;
    defaultValues?: Record<string, string>;
    onSubmit(values: Record<string, string>): void;
  };

const oauth2FormSchema = z.object({
  name: z.string().min(3, {
    message: 'Name must be at least 3 characters.',
  }),
  clientId: z.string().min(1, {
    message: 'Required.',
  }),
  clientSecret: z.string().min(1, {
    message: 'Required.',
  }),
});
function CredentialOAuth2({
  onSubmit,
  children,
  extension,
  credential,
  defaultValues = {},
  ...props
}: CredentialProps) {
  const form = useForm<z.infer<typeof oauth2FormSchema>>({
    resolver: zodResolver(oauth2FormSchema),
    defaultValues: {
      clientId: '',
      clientSecret: '',
      name: `${credential.providerName} account`,
      ...defaultValues,
    },
  });

  return (
    <UiForm {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} {...props}>
        <div className="space-y-3">
          <UiFormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <UiFormItem className="space-y-0">
                <UiFormLabel className="ml-1">Name</UiFormLabel>
                <UiFormControl>
                  <UiInput
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    placeholder={`${credential.providerName} account`}
                    {...field}
                  />
                </UiFormControl>
                <UiFormMessage />
              </UiFormItem>
            )}
          />
          <div>
            <UiLabel className="ml-1 mb-1" htmlFor="cred-callback-url">
              Callback URL
            </UiLabel>
            <UiInput
              id="cred-callback-url"
              readOnly
              onClick={(event) => (event.target as HTMLInputElement).select()}
              value="http://localhost:40401/oauth2/callback"
            />
          </div>
          <UiFormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <UiFormItem className="space-y-0">
                <UiFormLabel className="ml-1">Client Id</UiFormLabel>
                <UiFormControl>
                  <UiInput {...field} />
                </UiFormControl>
                <UiFormMessage />
              </UiFormItem>
            )}
          />
          <UiFormField
            control={form.control}
            name="clientSecret"
            render={({ field }) => (
              <UiFormItem className="space-y-0">
                <UiFormLabel className="ml-1">Client Secret</UiFormLabel>
                <UiFormControl>
                  <UiInput {...field} type="password" />
                </UiFormControl>
                <UiFormMessage />
              </UiFormItem>
            )}
          />
        </div>
        {children}
      </form>
    </UiForm>
  );
}

interface CredentialDetailProps extends React.HTMLAttributes<HTMLDivElement> {
  isEditing?: boolean;
  onClose?: () => void;
  credentialId?: string;
  credential: ExtensionCredential;
  defaultValues?: Record<string, string>;
  extension: { id: string; title: string };
}
function CredentialDetail({
  onClose,
  extension,
  isEditing,
  credential,
  credentialId,
  defaultValues,
  ...props
}: CredentialDetailProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(values: Record<string, string>) {
    try {
      setIsSubmitting(true);

      const { name, ...value } = values;
      let result: unknown;

      if (isEditing) {
        if (!credentialId) {
          throw new Error('Missing credentialId on editing mode');
        }

        result = await preloadAPI.main.ipc.invoke(
          'database:update-extension-credential',
          credentialId,
          {
            name,
            value,
          },
        );
      } else {
        result = await preloadAPI.main.ipc.invoke(
          'database:insert-extension-credential',
          {
            name,
            value,
            extensionId: extension.id,
            providerId: credential.providerId,
          },
        );
      }

      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
        return;
      }

      onClose?.();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong!',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div {...props}>
      <div className="h-11 w-11">
        <UiExtensionIcon
          id={extension.id}
          alt={credential.providerName}
          icon={credential.providerIcon}
        />
      </div>
      <h2 className="text-lg font-semibold mt-1 leading-tight">
        {credential.providerName}
      </h2>
      <p className="text-muted-foreground text-sm line-clamp-2">
        {extension.title} • {credential.description}
      </p>
      <CredentialOAuth2
        className="mt-3"
        onSubmit={onSubmit}
        extension={extension}
        credential={credential}
        defaultValues={defaultValues}
      >
        <div className="mt-8 flex items-center justify-end gap-4">
          <UiButton
            type="reset"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </UiButton>
          <UiButton
            type="submit"
            className="min-w-24 relative"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <div className="absolute flex items-center justify-center bg-black/20 h-full w-full rounded-md">
                <Loader2Icon className="animate-spin" />
              </div>
            )}
            {isEditing ? 'Update' : 'Add'}
          </UiButton>
        </div>
      </CredentialOAuth2>
    </div>
  );
}

export default CredentialDetail;
