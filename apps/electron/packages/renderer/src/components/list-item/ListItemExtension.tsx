import { UiList, UiListItemAction } from '@repo/ui';
import { ListItemRenderDetail } from '../../apps/command/routes/CommandList';
import { RotateCcwIcon, AlertTriangleIcon, BoltIcon } from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandStore } from '/@/stores/command.store';
import { useShallow } from 'zustand/react/shallow';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useUiListStore } from '@repo/ui/dist/context/list.context';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';

function ListItemExtension({
  item,
  props,
  itemRef,
  selected,
}: ListItemRenderDetail<'extension'>) {
  const [showExtensionErrorOverlay] = useCommandStore(
    useShallow((state) => [state.showExtensionErrorOverlay]),
  );
  const hasError = useCommandStore((state) =>
    Object.hasOwn(state.extensionErrors, item.metadata.extension.id),
  );
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const uiListStore = useUiListStore();
  const navigate = useCommandNavigate();

  const { extension } = item.metadata;

  const actions: UiListItemAction[] = [];
  if (extension.isLocal) {
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
  if (extension.isError || hasError) {
    actions.push({
      icon: AlertTriangleIcon,
      onAction() {
        const errors = [];
        if (extension.isError) {
          errors.push({
            content: extension.errorMessage ?? '',
            title: 'Extension error',
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
  } else if (extension.config && extension.config?.length > 0) {
    actions.push({
      icon: BoltIcon,
      onAction() {
        navigate(`/configs/${extension.id}`, {
          data: {
            config: extension.config,
          },
          panelHeader: {
            title: extension.title,
            icon: extension.icon,
          },
        });
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
