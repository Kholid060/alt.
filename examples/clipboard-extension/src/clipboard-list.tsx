import dayjs from 'dayjs';
import { ChangeEvent, useEffect, useState } from 'react';
import { UiList, commandRenderer, Extension, UiImage, UiInput, UiListItem, UiExtIcon } from '@alt-dot/extension';
import ItemList from './components/ItemList';

function CommandMain() {
  const [apps, setApps] = useState<Extension.shell.installedApps.AppDetail[]>([]);

  const toast = _extension.ui.createToast({
    title: 'Toast',
  });

  useEffect(() => {
    console.log('Today date is', dayjs().format('DD MMMM YYYY'));
    _extension.shell.installedApps.query('').then(setApps);

    _extension.ui.searchPanel.onChanged.addListener((value) => {
      console.log('onChange', value);
    });
    _extension.ui.searchPanel.onKeydown.addListener((value) => {
      console.log('onKeydown', value);
    });
    _extension.runtime.config.getValues('command').then(console.log)

    _extension.browser.activeTab.get().then(console.log);
    _extension.browser.activeTab.type('textarea[name="q"]', 'Hello 世界').then(console.log);
  }, []);

  const customItem: UiListItem[] = [
    {
      title: 'Hello world',
      value: 'testing',
      async onSelected() {
        const inputEl = await _extension.browser.activeTab.findElement('input');
        await inputEl.type('hello');
      }
    },
    {
      title: 'Toast',
      value: 'toast',
      onSelected() {
        console.log('toast');
        toast.show({ type: 'loading' });
      },
      actions: [
        {
          title: 'Hide toast',
          value: 'hide-toast',
          color: 'destructive',
          icon: UiExtIcon.Bike,
          onAction() {
            toast.hide();
          }
        }
      ]
    }
  ]
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
      },
      {
        icon: UiExtIcon.FolderOpen,
        title: 'Open file location',
        value: 'open-file',
        onAction() {
          _extension.shell.installedApps.showInFolder(app.appId);
        },
      },
    ],
    icon: <UiImage src={_extension.shell.installedApps.getIconURL(app.appId)} style={{ height: '100%', width: '100%' }} />
  }));

  return (
    <div className="p-2">
      <ItemList />
      <UiList items={[...customItem,...items]} />
    </div>
  );
}

export default commandRenderer(CommandMain);
