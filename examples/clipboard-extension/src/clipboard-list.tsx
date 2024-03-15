import dayjs from 'dayjs';
import { ChangeEvent, useEffect, useState } from 'react';
import { UiList, commandRenderer, Extension, UiImage, UiInput } from '@repo/extension';

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

  const items = apps.map((app) => ({
    title: app.name,
    value: app.appId,
    icon: <UiImage src={_extension.shell.installedApps.getIconURL(app.appId)} style={{ height: '100%', width: '100%' }} />
  }));
  
  async function onInputFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = event.target.files[0];
      const fileExists = await _extension.fs.exists(file.path);
      console.log({ fileExists });

      const data = await _extension.fs.readFile(file.path);
      console.log('READ', data);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="p-4">
      <UiInput type="file" onChange={onInputFileChange} />
    </div>
  );
}

export default commandRenderer(CommandMain);
