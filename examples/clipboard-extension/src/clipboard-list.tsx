import dayjs from 'dayjs';
import { ChangeEvent, useEffect, useState } from 'react';
import { UiList, UiImage, UiInput, UiListItem, UiIcons, _extension } from '@altdot/extension';
import ItemList from './components/ItemList';

function InifinitePage({ depth }: { depth: number }) {
  return (
    <div>
      <button onClick={() => _extension.ui.navigation.push(<InifinitePage depth={depth + 1} />)}>Go depth</button>
      <button onClick={() => _extension.ui.navigation.pop()}>Pop stack</button>
      <button onClick={() => _extension.ui.navigation.pop({ root: true })}>Pop to root</button>
      Page depth: {depth}
    </div>
  )
}

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

  const anu: Test = {

  }

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
          icon: UiIcons.Bike,
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
        icon: UiIcons.Clipboard,
        title: 'Paste',
        value: 'paste',
        onAction() {
          _extension.clipboard.paste(app.name);
        },
      },
      {
        type: 'button',
        icon: UiIcons.FolderOpen,
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
      <button onClick={() => _extension.viewAction.async.sendMessage('test').then(console.log)}>Test</button>
      <InifinitePage depth={0} />
      <UiList items={[...customItem,...items]} />
    </div>
  );
}

export default CommandMain;
