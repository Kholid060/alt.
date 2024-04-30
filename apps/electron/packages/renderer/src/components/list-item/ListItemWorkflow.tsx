import { WORKFLOW_MANUAL_TRIGGER_ID } from '#packages/common/utils/constant/constant';
import { UiList } from '@repo/ui';
import { ListItemRenderDetail } from '/@/apps/command/routes/CommandList';
import preloadAPI from '/@/utils/preloadAPI';
import { UiExtIcon } from '@repo/extension';

function ListItemWorkflow({
  item,
  itemRef,
  props,
  selected,
}: ListItemRenderDetail<'workflow'>) {
  const Icon =
    UiExtIcon[item.icon as keyof typeof UiExtIcon] ?? UiExtIcon.Command;

  return (
    <UiList.Item
      ref={itemRef}
      {...{ ...props, ...item, selected }}
      icon={<UiList.Icon icon={Icon} />}
      onSelected={() =>
        preloadAPI.main.ipc.invoke('workflow:execute', {
          id: item.metadata.workflowId,
          startNodeId: WORKFLOW_MANUAL_TRIGGER_ID,
        })
      }
    />
  );
}

export default ListItemWorkflow;
