import {
  UiInput,
  UiToggleGroup,
  UiToggleGroupItem,
  useToast,
} from '@altdot/ui';
import { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import ExtensionListTable from '/@/components/extension/ExtensionListTable';
import ExtensionDetailCard from '/@/components/extension/ExtensionDetailCard';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import preloadAPI from '/@/utils/preloadAPI';
import {
  ExtensionListItemModel,
  ExtensionUpdatePayload,
} from '#packages/main/src/extension/extension.interface';
import { useDocumentTitle } from '/@/hooks/useDocumentTitle';

type FilterTypes = 'all' | 'commands' | 'extensions' | 'scripts';

const filterItems: { id: FilterTypes; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'extensions', name: 'Extensions' },
  { id: 'commands', name: 'Commands' },
  { id: 'scripts', name: 'Scripts' },
];

function RouteExtension() {
  useDocumentTitle('Extensions');

  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTypes>('all');

  const [selectedExtensionId, setSelectedExtensionId] = useState('');

  const extensionQuery = useDatabaseQuery('database:get-extension-list', []);

  async function updateExtension(
    extensionId: string,
    data: ExtensionUpdatePayload,
  ) {
    try {
      await preloadAPI.main.ipc.invoke(
        'database:update-extension',
        extensionId,
        data,
      );
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error when updating extension',
        description: (error as Error).message,
        className: 'text-foreground!',
      });
    }
  }

  const filteredExtensions = (extensionQuery.data ?? []).reduce<
    ExtensionListItemModel[]
  >((acc, extension) => {
    const searchStr = search.toLowerCase();
    const filteredCommands = extension.isError
      ? []
      : extension.commands.filter((command) => {
          let isMatchFilter = false;
          switch (activeFilter) {
            case 'commands':
              isMatchFilter = command.type !== 'script';
              break;
            case 'scripts':
              isMatchFilter = command.type === 'script';
              break;
            case 'all':
              isMatchFilter = true;
              break;
          }

          return (
            isMatchFilter &&
            (command.title.toLowerCase().includes(searchStr) ||
              command.alias?.includes(searchStr))
          );
        });

    if (!extension.isError && filteredCommands.length > 0) {
      acc.push({
        ...extension,
        commands: filteredCommands,
      });
      return acc;
    }

    const searchFilter = extension.title.toLowerCase().includes(searchStr);
    const categoryFilter =
      activeFilter === 'all' ? true : activeFilter === 'extensions';

    if (searchFilter && categoryFilter) {
      let extensionData = extension;
      if (!extension.isError) {
        extensionData = {
          ...extension,
          commands: filteredCommands,
        };
      }

      acc.push(extensionData);
    }

    return acc;
  }, []);

  return (
    <div className="container p-8">
      <h2 className="-mt-0.5 text-2xl font-semibold leading-tight">
        Extensions
      </h2>
      <div className="mt-8 flex items-center">
        <UiToggleGroup
          type="single"
          value={activeFilter}
          onValueChange={(value) => setActiveFilter(value as FilterTypes)}
        >
          {filterItems.map((item) => (
            <UiToggleGroupItem value={item.id} key={item.id}>
              {item.name}
            </UiToggleGroupItem>
          ))}
        </UiToggleGroup>
        <div className="flex-grow"></div>
        <UiInput
          value={search}
          prefixIcon={<SearchIcon className="h-5 w-5" />}
          className="w-64"
          placeholder="Search..."
          onValueChange={setSearch}
        />
      </div>
      <div className="mt-4 flex overflow-hidden rounded-lg border text-sm">
        <div className={`flex-grow ${selectedExtensionId ? 'border-r' : ''}`}>
          <ExtensionListTable
            extensions={filteredExtensions}
            onUpdateExtension={updateExtension}
            onExtensionSelected={setSelectedExtensionId}
          />
        </div>
        {selectedExtensionId && (
          <div className="w-72 flex-shrink-0">
            <ExtensionDetailCard
              key={selectedExtensionId}
              extensionId={selectedExtensionId}
              onClose={() => setSelectedExtensionId('')}
            >
              <p>Extension detail</p>
            </ExtensionDetailCard>
          </div>
        )}
      </div>
    </div>
  );
}

export { RouteExtension as Component };
