import { CommandJSONViewList, UiList, UiListItem } from '@repo/extension';
import { UiListItemAction } from '@repo/ui';
import defaultCommandActions from '/@/utils/defaultCommandActions';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { useCommandViewJSON } from '/@/context/command-view-json.context';
import { useCommandPanelStore } from '/@/stores/command-panel.store';

function CommandViewJSONList({ data }: { data: CommandJSONViewList }) {
  const { payload } = useCommandViewJSON();
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
              executePayload: payload,
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

    const icon = item.icon ? (
      <UiExtensionIcon
        icon={item.icon}
        extensionIcon={false}
        id={payload.extensionId}
        alt={`${item.title} icon`}
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
