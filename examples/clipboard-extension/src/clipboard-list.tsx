import dayjs from 'dayjs';
import { ChangeEvent, useEffect, useState } from 'react';
import { UiList, commandRenderer, Extension, UiImage, UiInput, UiListItem, UiExtIcon } from '@repo/extension';
import ItemList from './components/ItemList';

function CommandMain() {
  const [apps, setApps] = useState<Extension.shell.installedApps.AppDetail[]>([]);

  useEffect(() => {
    console.log('Today date is', dayjs().format('DD MMMM YYYY'));
    _extension.shell.installedApps.query('').then(setApps);

    _extension.ui.searchPanel.onChanged.addListener((value) => {
      console.log('onChange', value);
    });
    _extension.ui.searchPanel.onKeydown.addListener((value) => {
      console.log('onKeydown', value);
    });
  }, []);

  const items: UiListItem[] = apps.map((app) => ({
    title: app.name,
    value: app.appId,
    onSelected() {
      _extension.shell.installedApps.launch(app.appId);
    },
    actions: [
      {
        icon: UiExtIcon.Clipboard,
        title: 'Paste',
        value: 'paste',
        onAction() {
          _extension.clipboard.paste(app.name);
        },
      }
    ],
    icon: <UiImage src={_extension.shell.installedApps.getIconURL(app.appId)} style={{ height: '100%', width: '100%' }} />
  }));

  return (
    <div className="p-2">
      <ItemList />
      <UiList items={items} />
    </div>
  );
}

export default commandRenderer(CommandMain);
