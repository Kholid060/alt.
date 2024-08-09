import { useCommandRoute } from '/@/hooks/useCommandRoute';
import { CommandJSONView } from '@altdot/extension';
import CommandViewJSONText from '/@/components/command-view-json/CommandViewJSONText';
import CommandViewJSONList from '/@/components/command-view-json/CommandViewJSONList';
import { CommandViewJSONProvider } from '/@/context/command-view-json.context';
import { ExtensionCommandJSONViewData } from '#common/interface/extension.interface';
import CommandViewJSONForm from '/@/components/command-view-json/CommandViewJSONForm';
import { useCommandPanelHeader } from '/@/hooks/useCommandPanelHeader';
import { useUiListStore } from '@altdot/ui';
import { useEffect } from 'react';

const componentsMap: {
  [T in CommandJSONView['type']]: React.FC<{
    data: Extract<CommandJSONView, { type: T }>;
  }>;
} = {
  form: CommandViewJSONForm,
  text: CommandViewJSONText,
  list: CommandViewJSONList,
};

function CommandViewJSON() {
  const listStore = useUiListStore();
  const activeRoute = useCommandRoute((state) => state.currentRoute);
  const { detail, view } = activeRoute?.data as ExtensionCommandJSONViewData;

  useCommandPanelHeader({
    icon: detail.icon,
    title: detail.title,
    subtitle: detail.subtitle,
  });

  const Component = componentsMap[view.type] as React.FC<{
    data: CommandJSONView;
  }>;

  useEffect(() => {
    listStore.setState('search', '');
  }, [listStore]);

  if (!Component) return null;

  return (
    <CommandViewJSONProvider payload={activeRoute.data}>
      <Component data={view} />
    </CommandViewJSONProvider>
  );
}

export default CommandViewJSON;
