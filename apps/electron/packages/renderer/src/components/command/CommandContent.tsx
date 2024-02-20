import { UiCommandList } from '@repo/ui';
import CommandList from './CommandList';
import { useCommandStore } from '/@/stores/command.store';

function CommandContent() {
  const paths = useCommandStore((state) => state.paths);

  return (
    <UiCommandList
      className="px-2 py-4 max-h-80 min-h-48"
      style={{ height: 'var(--cmdk-list-height)', transition: 'height 200ms ease' }}
    >
      {/* <iframe src="/sandbox" sandbox="allow-scripts" title="huh" /> */}
      <CommandList />
    </UiCommandList>
  );
}

export default CommandContent;
