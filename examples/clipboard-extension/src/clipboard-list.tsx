import dayjs from 'dayjs';
import { ChangeEvent, useEffect, useState } from 'react';
import { UiList, commandRenderer, UiImage, UiInput, UiListItem, UiExtIcon, _extension } from '@altdot/extension';
import ItemList from './components/ItemList';

function CommandMain() {
  const [apps, setApps] = useState<_extension.Shell.InstalledApps.AppDetail[]>([]);

  const toast = _extension.ui.createToast({
    title: 'Toast',
  });

  useEffect(() => {
    console.log('Today date is', dayjs().format('DD MMMM YYYY'));
    _extension.shell.installedApps.query('').then(setApps);

    _extension.ui.searchPanel.onChanged.addListener((value) => {
      console.log('onChange', value);
    });
    _extension.runtime.config.getValues('command').then(console.log)
  }, []);

  const customItem: UiListItem[] = [
    {
      title: 'Hello world',
      value: 'testing',
      async onSelected() {
        const activeTab = await _extension.browser.tabs.getActive();
        if (!activeTab) return;

        const inputEl = await activeTab.findElement('input');
        await inputEl?.type('hello');
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
          type: 'button',
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
      console.log('hello')
      _extension.shell.installedApps.launch(app.appId);
    },
    actions: [
      {
        type: 'button',
        icon: UiExtIcon.Clipboard,
        title: 'Paste',
        value: 'paste',
        onAction() {
          _extension.clipboard.paste(app.name);
        },
      },
      {
        type: 'button',
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
