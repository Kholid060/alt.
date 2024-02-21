import { CSSProperties, useEffect, useState } from 'react';
import { GripHorizontalIcon } from 'lucide-react';
import { UiButton, UiCommand } from '@repo/ui';
import CommandHeader from './components/command/CommandHeader';
import CommandFooter from './components/command/CommandFooter';
import CommandContent from './components/command/CommandContent';
import { useCommandStore } from './stores/command.store';
import { sendIpcMessage } from '#preload';
import { PublicInstalledAppDetail } from '#common/interface/installed-apps';
import defaultFileIcon from '#common/assets/images/file-digit.png';
import UiImage from './components/ui/UiImage';
console.log(defaultFileIcon);
function App() {
  const setCommandStoreState = useCommandStore((state) => state.setState);

  const [apps, setApps] = useState<PublicInstalledAppDetail[]>([]);

  useEffect(() => {
    sendIpcMessage('extension:list').then((extensions) => {
      setCommandStoreState('extensions', extensions);
    });
    sendIpcMessage('apps:get-list').then(setApps);
  }, []);

  console.log(apps);

  return (
    <>
      {import.meta.env.DEV &&
        <UiButton
          size="icon"
          variant="secondary"
          className="mb-2 cursor-move"
          style={{ WebkitAppRegion: 'drag' } as CSSProperties}
        >
          <GripHorizontalIcon className="h-5 w-5" />
        </UiButton>
      }
      <UiCommand className="border rounded-lg">
        <CommandHeader />
        <CommandContent />
        <CommandFooter />
      </UiCommand>
      <ul className="h-64 overflow-auto">
        {apps.map((app) =>
          <li key={app.appId}>
            <UiImage src={`app-icon://${app.icon}`} fallbackSrc={defaultFileIcon} />
            <p>{app.name}</p>
          </li>
        )}
      </ul>
    </>
  );
}

export default App;
