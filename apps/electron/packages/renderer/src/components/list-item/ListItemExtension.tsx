import { UiList, UiListItemAction } from '@altdot/ui';
import { ListItemRenderDetail } from '../../apps/command/routes/CommandList';
import {
  RotateCcwIcon,
  AlertTriangleIcon,
  BoltIcon,
  ToggleRightIcon,
  ToggleLeftIcon,
} from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandStore } from '/@/stores/command.store';
import { useShallow } from 'zustand/react/shallow';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useUiListStore } from '@altdot/ui';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { ExtensionErrorListItemModel } from '#packages/main/src/extension/extension-error/extension-error.interface';
import { isIPCEventError } from '#packages/common/utils/helper';

function ListItemExtension({
  item,
  props,
  itemRef,
  selected,
}: ListItemRenderDetail<'extension'>) {
  const [showExtensionErrorOverlay] = useCommandStore(
    useShallow((state) => [state.showExtensionErrorOverlay]),
  );
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const uiListStore = useUiListStore();
  const navigate = useCommandNavigate();

  const hasError = item.metadata.extension.errorsCount > 0;

  const { extension } = item.metadata;

  const actions: UiListItemAction[] = [
    {
      type: 'button',
      title: 'Enable',
      value: 'enable',
      icon: extension.isDisabled ? ToggleLeftIcon : ToggleRightIcon,
      onAction() {
        preloadAPI.main.ipc.invoke('database:update-extension', extension.id, {
          isDisabled: !extension.isDisabled,
        });
      },
    },
  ];

  if ((extension.isError || hasError) && !extension.isDisabled) {
    actions.unshift({
      type: 'button',
      icon: AlertTriangleIcon,
      onAction() {
        const errors: ExtensionErrorListItemModel[] = [];
        if (extension.isError) {
          errors.push({
            id: -1,
            title: 'Extension error',
            extensionId: extension.id,
            createdAt: new Date().toISOString(),
            message: extension.errorMessage ?? '',
          });
        }

        showExtensionErrorOverlay({
          errors,
          extensionId: extension.id,
          title: `Errors in "${extension.title}" extension`,
        });
      },
      value: 'errors',
      title: 'See errors',
      color: 'destructive',
    });
  } else if (
    extension.config &&
    extension.config?.length > 0 &&
    !extension.isDisabled
  ) {
    actions.unshift({
      type: 'button',
      icon: BoltIcon,
      onAction() {
        navigate(`/configs/${extension.id}`);
      },
      title: 'Config',
      value: 'config',
      shortcut: { key: ',', mod1: 'ctrlKey' },
    });
  }
  if (extension.isLocal && !extension.isDisabled) {
    actions.unshift({
      type: 'button',
      icon: RotateCcwIcon,
      async onAction() {
        try {
          const result = await preloadAPI.main.ipc.invoke(
            'extension:reload',
            extension.id,
          );
          if (isIPCEventError(result)) {
            addPanelStatus({
              type: 'error',
              title: 'Error!',
              description: result.message,
            });
            return;
          }

          addPanelStatus({
            type: 'success',
            title: 'Extension reloaded',
          });
        } catch (error) {
          console.error(error);
        }
      },
      title: 'Reload extension',
      value: 'reload-extension',
      shortcut: { key: 'r', mod1: 'mod', mod2: 'shiftKey' },
    });
  }

  return (
    <UiList.Item
      ref={itemRef}
      {...{ ...props, ...item, selected, actions }}
      className={item.metadata.extension.isDisabled ? 'opacity-60' : ''}
      onSelected={() => uiListStore.setState('search', `ext:${extension.id}`)}
      suffix={
        extension.isLocal && (
          <>
            <span className="text-xs text-muted-foreground">
              Local Extension
            </span>
            {(extension.isError || hasError) && (
              <AlertTriangleIcon className="ml-2 h-4 w-4 text-destructive-text" />
            )}
          </>
        )
      }
    />
  );
}

export default ListItemExtension;
