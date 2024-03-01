import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { ExtCommandList, ExtCommandListItem, commandRenderer, Extension, ExtImage } from '@repo/extension';

function CommandMain() {
  const [apps, setApps] = useState<Extension.installedApps.AppDetail[]>([]);

  useEffect(() => {
    console.log('Today date is', dayjs().format('DD MMMM YYYY'));
    _extension.installedApps.query('').then(setApps);
  }, []);

  return (
    <>
      <ExtCommandList>
        {apps.length === 0 && <p>LOADING...</p>}
        {apps.map((app) => 
          <ExtCommandListItem
            title={app.name}
            onSelect={() => _extension.installedApps.launch(app.appId)}
            prefix={<ExtImage src={_extension.installedApps.getIconURL(app.appId)} style={{ height: '100%', width: '100%' }} />}
          />
        )}
      </ExtCommandList>
    </>
  );
}

export default commandRenderer(CommandMain);
