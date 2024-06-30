import { UiList, UiListItemAction } from '@alt-dot/ui';
import { ListItemRenderDetail } from '../../apps/command/routes/CommandList';
import {
  RotateCcwIcon,
  AlertTriangleIcon,
  BoltIcon,
  ToggleRight,
} from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandStore } from '/@/stores/command.store';
import { useShallow } from 'zustand/react/shallow';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useUiListStore } from '@alt-dot/ui/dist/context/list.context';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { ExtensionErrorListItemModel } from '#packages/main/src/extension/extension-error/extension-error.interface';

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

  const actions: UiListItemAction[] = [];
  if (extension.isDisabled) {
    actions.push({
      title: 'Enable',
      value: 'enable',
      icon: ToggleRight,
      onAction() {
        preloadAPI.main.ipc.invoke('database:update-extension', extension.id, {
          isDisabled: false,
        });
      },
    });
  }
  if (extension.isLocal && !extension.isDisabled) {
    actions.push({
      icon: RotateCcwIcon,
      async onAction() {
        try {
          const result = await preloadAPI.main.ipc.invoke(
            'extension:reload',
            extension.id,
          );
          if (!result) return;

          if ('$isError' in result) {
            addPanelStatus({
              type: 'error',
              title: 'Error!',
              description: result.message,
            });
            return;
          }
        } catch (error) {
          console.error(error);
        }
      },
      title: 'Reload extension',
      value: 'reload-extension',
      shortcut: { key: 'r', mod1: 'mod', mod2: 'shiftKey' },
    });
  }
  if ((extension.isError || hasError) && !extension.isDisabled) {
    actions.push({
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
    actions.push({
      icon: BoltIcon,
      onAction() {
        navigate(`/configs/${extension.id}`);
      },
      title: 'Config',
      value: 'config',
      shortcut: { key: ',', mod1: 'ctrlKey' },
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
              <AlertTriangleIcon className="h-4 w-4 text-destructive-text ml-2" />
            )}
          </>
        )
      }
    />
  );
}

export default ListItemExtension;
