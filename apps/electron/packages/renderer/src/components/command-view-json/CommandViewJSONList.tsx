import { CommandJSONViewList } from '@altdot/extension';
import { UiIcons, UiListItemAction, UiList, UiListItem } from '@altdot/ui';
import defaultCommandActions from '/@/utils/defaultCommandActions';
import { useCommandPanelStore } from '/@/stores/command-panel.store';

function CommandViewJSONList({ data }: { data: CommandJSONViewList }) {
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
            },
            action as never,
          );
        };

        if (!defaultAction && action.defaultAction) {
          defaultAction = onAction;
        }

        return {
          onAction,
          type: 'button',
          icon: actionData.icon,
          title: actionData.title,
          value: action.type + index,
        };
      },
    );

    const Icon = item.icon
      ? UiIcons[item.icon as keyof typeof UiIcons]
      : undefined;
    return {
      actions,
      title: item.title,
      value: item.value,
      subtitle: item.subtitle,
      description: item.description,
      icon: Icon && <UiList.Icon icon={Icon} />,
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
