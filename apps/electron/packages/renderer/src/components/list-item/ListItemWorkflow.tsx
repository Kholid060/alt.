import { WORKFLOW_MANUAL_TRIGGER_ID } from '#packages/common/utils/constant/workflow.const';
import { UiIcons, UiList, UiListItemAction } from '@alt-dot/ui';
import { ListItemRenderDetail } from '/@/apps/command/routes/CommandList';
import preloadAPI from '/@/utils/preloadAPI';
import {
  EditIcon,
  LinkIcon,
  PinIcon,
  PinOffIcon,
  WorkflowIcon,
} from 'lucide-react';
import DeepLinkURL from '#packages/common/utils/DeepLinkURL';
import { useCommandPanelStore } from '/@/stores/command-panel.store';

function ListItemWorkflow({
  item,
  itemRef,
  props,
  selected,
}: ListItemRenderDetail<'workflow'>) {
  const addPanelStatus = useCommandPanelStore.use.addStatus();

  const Icon = UiIcons[item.icon as keyof typeof UiIcons] ?? WorkflowIcon;

  const actions: UiListItemAction[] = [
    {
      icon: EditIcon,
      shortcut: { key: 'e', mod1: 'mod' },
      title: 'Edit workflow',
      value: 'workflow:' + item.metadata.workflowId,
      onAction() {
        preloadAPI.main.ipc.invoke('command-window:close').then(() => {
          preloadAPI.main.ipc.send(
            'dashboard-window:open',
            `/workflows/${item.metadata.workflowId}`,
          );
        });
      },
    },
    {
      onAction() {
        preloadAPI.main.ipc
          .invoke(
            'clipboard:copy',
            DeepLinkURL.getWorkflow(item.metadata.workflowId),
          )
          .then((value) => {
            if (value && '$isError' in value) return;

            addPanelStatus({
              type: 'success',
              title: 'Copied to clipboard',
            });
          });
      },
      icon: LinkIcon,
      title: 'Copy Deep Link',
      value: 'copy-deeplink',
    },
    {
      onAction() {
        preloadAPI.main.ipc.invoke(
          'database:update-workflow',
          item.metadata.workflowId,
          {
            isPinned: !item.metadata.isPinned,
          },
        );
      },
      value: 'unpin-workflow',
      icon: item.metadata.isPinned ? PinOffIcon : PinIcon,
      title: item.metadata.isPinned ? 'Unpin workflow' : 'Pin workflow',
    },
  ];

  return (
    <UiList.Item
      ref={itemRef}
      {...{ ...props, ...item, selected }}
      actions={actions}
      icon={<UiList.Icon icon={Icon} />}
      onSelected={async () => {
        await preloadAPI.main.ipc.invoke('command-window:close');
        preloadAPI.main.ipc.invoke('workflow:execute', {
          id: item.metadata.workflowId,
          startNodeId: WORKFLOW_MANUAL_TRIGGER_ID,
        });
      }}
    />
  );
}

export default ListItemWorkflow;
