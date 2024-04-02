import { CommandJSONViewList, UiList, UiListItem } from '@repo/extension';
import { UiListItemAction } from '@repo/ui';
import defaultCommandActions from '/@/utils/defaultCommandActions';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { useCommandViewJSON } from '/@/context/command-view-json.context';
import { useCommandPanelStore } from '/@/stores/command-panel.store';

function CommandViewJSONList({ data }: { data: CommandJSONViewList }) {
  const { extension, commandId } = useCommandViewJSON();
  const addStatus = useCommandPanelStore.use.addStatus();

  const items: UiListItem[] = data.items.map((item) => {
    let defaultAction: (() => unknown) | null = null;
    const actions: UiListItemAction[] = (item.actions ?? []).map(
      (action, index) => {
        const actionData = defaultCommandActions[action.type];
        const onAction = () => {
          actionData.onAction(
            {
              addStatus,
              commandId,
              extension: extension!,
            },
            action as never,
          );
        };

        if (!defaultAction && action.defaultAction) {
          defaultAction = onAction;
        }

        return {
          onAction,
          icon: actionData.icon,
          title: actionData.title,
          value: action.type + index,
        };
      },
    );

    const icon =
      item.icon && extension ? (
        <UiExtensionIcon
          id={extension.id}
          extensionIcon={false}
          alt={`${item.title} icon`}
          icon={item.icon}
          iconWrapper={(icon) => <UiList.Icon icon={icon} />}
        />
      ) : undefined;

    return {
      icon,
      actions,
      title: item.title,
      value: item.value,
      subtitle: item.subtitle,
      description: item.description,
      onSelected: () => {
        if (!defaultAction) return;

        defaultAction();
      },
    };
  });

  return (
    <UiList
      items={items}
      className="p-2"
      shouldFilter={data.shouldFilter ?? true}
    />
  );
}

export default CommandViewJSONList;
