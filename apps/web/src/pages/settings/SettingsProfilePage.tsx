import { useUserStore } from '@/stores/user.store';
import {
  UiAlert,
  UiAlertDescription,
  UiAlertTitle,
  UiAvatar,
  UiAvatarFallback,
  UiAvatarImage,
  UiButton,
  UiButtonLoader,
  UiForm,
  UiFormControl,
  UiFormField,
  UiFormItem,
  UiFormLabel,
  UiFormMessage,
  UiInput,
  UiLabel,
  useToast,
} from '@alt-dot/ui';
import { TriangleAlertIcon, UserRoundIcon } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useSearchParams } from 'react-router-dom';
import APIService from '@/services/api.service';
import { FetchError } from '@/utils/afetch';

const profileSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Name must contain at least 3 character(s)' })
    .max(64, 'Name must contain at most 64 character(s)'),
  username: z
    .string()
    .min(3, { message: 'Username must contain at least 3 character(s)' })
    .max(32, 'Username must contain at most 32 character(s)')
    .regex(/^[a-z0-9_-]*$/, {
      message:
        'Username can only contain lowercase letters, numbers, and underscores(_)',
    }),
});
type ProfileSchema = z.infer<typeof profileSchema>;

function SettingsProfilePage() {
  const profile = useUserStore.use.profile()!;
  const updateProfile = useUserStore.use.updateProfile();

  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      username: profile.username ?? '',
    },
  });

  async function onSubmit(values: ProfileSchema) {
    try {
      const updatedProfile = await APIService.instance.me.update(values);
      updateProfile(updatedProfile);

      form.reset(values);
    } catch (error) {
      if (error instanceof FetchError && error.data.statusCode === 422) {
        form.setError('username', {
          message: 'This username has been taken already',
        });
      } else {
        toast({
          variant: 'destructive',
          title: APIService.getErrorMessage(error),
        });
      }

      console.error(error);
    }
  }

  const requiredUsername = searchParams.has('username') && !profile.username;

  return (
    <div className="w-full max-w-lg">
      {requiredUsername && (
        <UiAlert className="mb-8 border-amber-500 text-amber-500">
          <TriangleAlertIcon className="h-4 w-4 !text-amber-500" />
          <UiAlertTitle>Username required</UiAlertTitle>
          <UiAlertDescription>
            You must input your username first before using the app
          </UiAlertDescription>
        </UiAlert>
      )}
      <UiAvatar className="size-16 border-2">
        <UiAvatarImage
          src={profile.avatarUrl ?? undefined}
          alt={profile.name}
        />
        <UiAvatarFallback>
          <UserRoundIcon className="size-5" />
        </UiAvatarFallback>
      </UiAvatar>
      <UiForm {...form}>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <div>
            <UiLabel className="mb-1.5 inline-block ml-1">Email</UiLabel>
            <UiInput
              value={profile.email ?? ''}
              placeholder="email@example.com"
              readOnly
            />
          </div>
          <UiFormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <UiFormItem className="space-y-1">
                <UiFormLabel className="ml-1">Name</UiFormLabel>
                <UiFormControl>
                  <UiInput placeholder="John Doe" {...field} />
                </UiFormControl>
                <UiFormMessage />
              </UiFormItem>
            )}
          />
          <UiFormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <UiFormItem className="space-y-1">
                <UiFormLabel className="ml-1">Username</UiFormLabel>
                <UiFormControl>
                  <UiInput
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus={requiredUsername}
                    placeholder="john_doe"
                    {...field}
                  />
                </UiFormControl>
                <UiFormMessage />
              </UiFormItem>
            )}
          />
          <div className="pt-8 flex items-center gap-4 justify-end">
            <UiButton
              variant="secondary"
              type="reset"
              onClick={() => form.reset()}
              disabled={!form.formState.isDirty || form.formState.isSubmitting}
            >
              Cancel
            </UiButton>
            <UiButtonLoader
              type="submit"
              disabled={!form.formState.isDirty}
              isLoading={form.formState.isSubmitting}
            >
              Save changes
            </UiButtonLoader>
          </div>
        </form>
      </UiForm>
    </div>
  );
}

export default SettingsProfilePage;
