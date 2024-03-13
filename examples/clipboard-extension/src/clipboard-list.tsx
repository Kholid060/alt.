import dayjs from 'dayjs';
import { ChangeEvent, useEffect, useState } from 'react';
import { UiList, commandRenderer, Extension, UiImage, UiInput } from '@repo/extension';

function CommandMain() {
  const [apps, setApps] = useState<Extension.installedApps.AppDetail[]>([]);

  useEffect(() => {
    console.log('Today date is', dayjs().format('DD MMMM YYYY'));
    _extension.installedApps.query('').then(setApps);
  }, []);

  const items = apps.map((app) => ({
    title: app.name,
    value: app.appId,
    icon: <UiImage src={_extension.installedApps.getIconURL(app.appId)} style={{ height: '100%', width: '100%' }} />
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
