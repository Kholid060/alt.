import { WORKFLOW_MANUAL_TRIGGER_ID } from '#packages/common/utils/constant/constant';
import { UiList, UiListItemAction } from '@repo/ui';
import { ListItemRenderDetail } from '/@/apps/command/routes/CommandList';
import preloadAPI from '/@/utils/preloadAPI';
import { UiExtIcon } from '@repo/extension';
import { EditIcon } from 'lucide-react';

function ListItemWorkflow({
  item,
  itemRef,
  props,
  selected,
}: ListItemRenderDetail<'workflow'>) {
  const Icon =
    UiExtIcon[item.icon as keyof typeof UiExtIcon] ?? UiExtIcon.Command;

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
