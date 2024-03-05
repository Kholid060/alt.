import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { UiList, commandRenderer, Extension, UiImage } from '@repo/extension';

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

  return (
    <>
    {apps.length === 0
      ? <p>Loading....</p>
      : <UiList items={items} />
    }
    </>
  );
}

export default commandRenderer(CommandMain);
