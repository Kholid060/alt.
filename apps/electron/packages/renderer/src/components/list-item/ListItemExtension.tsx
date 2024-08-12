import { UiList, UiListItemAction, useDialog } from '@altdot/ui';
import { ListItemRenderDetail } from '../../apps/command/routes/CommandList';
import {
  RotateCcwIcon,
  AlertTriangleIcon,
  BoltIcon,
  ToggleRightIcon,
  ToggleLeftIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  StoreIcon,
  FolderOpenIcon,
} from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';
import { useCommandStore } from '/@/stores/command.store';
import { useShallow } from 'zustand/react/shallow';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { useUiListStore } from '@altdot/ui';
import { useCommandNavigate } from '/@/hooks/useCommandRoute';
import { ExtensionErrorListItemModel } from '#packages/main/src/extension/extension-error/extension-error.interface';
import { isIPCEventError } from '#packages/common/utils/helper';
import WebURL from '#packages/common/utils/WebURL';

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

  const dialog = useDialog();
  const uiListStore = useUiListStore();
  const navigate = useCommandNavigate();

  const hasError = item.metadata.extension.errorsCount > 0;

  const { extension } = item.metadata;

  const actions: UiListItemAction[] = [
    {
      type: 'button',
      value: 'enable',
      title: extension.isDisabled ? 'Enable' : 'Disable',
      icon: extension.isDisabled ? ToggleLeftIcon : ToggleRightIcon,
      onAction() {
        preloadAPI.main.ipc.invoke('database:update-extension', extension.id, {
          isDisabled: !extension.isDisabled,
        });
      },
    },
    {
      type: 'menu',
      title: 'More menu',
      icon: EllipsisVerticalIcon,
      value: 'extension-more-menu',
      items: [
        extension.isLocal
          ? {
              type: 'button',
              icon: FolderOpenIcon,
              title: 'Open extension folder',
              value: 'open-extension-folder',
              onAction() {
                preloadAPI.main.ipc.invoke(
                  'shell:open-in-folder',
                  extension.path,
                );
              },
            }
          : {
              type: 'button',
              icon: StoreIcon,
              onAction() {
                preloadAPI.main.ipc.invoke(
                  'shell:open-url',
                  WebURL.storeExtension(extension.name, extension.id),
                );
              },
              title: 'Open store page',
              value: 'extension-store-item',
            },
        {
          type: 'button',
          icon: TrashIcon,
          color: 'destructive',
          title: 'Delete extension',
          value: 'delete-extension',
          async onAction() {
            try {
              const isConfirmed = await dialog.confirm({
                title: 'Delete extension?',
                body: (
                  <>
                    Are you sure you want to delete{' '}
                    <b>&quot;{extension.title}&quot;</b> extension? <br /> This
                    will delete all the extension data and it can&apos;t be
                    undone
                  </>
                ),
                okText: 'Delete',
                okButtonVariant: 'destructive',
              });
              if (!isConfirmed) return;

              const result = await preloadAPI.main.ipc.invoke(
                'extension:delete',
                extension.id,
              );
              if (isIPCEventError(result)) {
                addPanelStatus({
                  type: 'error',
                  title: 'Error!',
                  description: result.message,
                });
              }
            } catch (error) {
              console.error(error);
              addPanelStatus({
                type: 'error',
                title: 'Something went wrong!',
              });
            }
          },
        },
      ],
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
