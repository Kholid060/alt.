import { UiCommandList } from '@repo/ui';
import CommandList from './CommandList';
import { useCommandStore } from '/@/stores/command.store';
import CommandExtensionContent from './CommandExtensionContent';

function CommandContent() {
  const paths = useCommandStore((state) => state.paths);
  console.log(paths);

  return (
    <UiCommandList
      className="max-h-80 min-h-48 px-2 py-4"
      style={{ height: 'var(--cmdk-list-height)', transition: 'height 200ms ease' }}
    >
      {/* <CommandExtensionContent extensionId='' /> */}
      <CommandList />
    </UiCommandList>
  );
}

export default CommandContent;
