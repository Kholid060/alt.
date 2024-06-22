import { UiDialog, UiButton } from '@alt-dot/ui';

function DevConsoleNewWorkflow({ onClose }: { onClose?: () => void }) {
  return (
    <UiDialog open onOpenChange={(value) => !value && onClose?.()}>
      <UiDialog.Content className="sm:max-w-[425px]">
        <UiDialog.Header>
          <UiDialog.Title>Share workflow</UiDialog.Title>
          <UiDialog.Description>
            Share your workflow to the store
          </UiDialog.Description>
        </UiDialog.Header>
        <UiDialog.Footer className="mt-6">
          <UiButton className="min-w-24" type="submit">
            Continue
          </UiButton>
        </UiDialog.Footer>
      </UiDialog.Content>
    </UiDialog>
  );
}

export default DevConsoleNewWorkflow;
