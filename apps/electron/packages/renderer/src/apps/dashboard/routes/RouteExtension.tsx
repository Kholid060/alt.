import { UiInput, UiToggleGroup, UiToggleGroupItem } from '@repo/ui';
import { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import ExtensionListTable from '/@/components/extension/ExtensionListTable';
import ExtensionDetailCard from '/@/components/extension/ExtensionDetailCard';
import { useDatabaseQuery } from '/@/hooks/useDatabase';
import { DatabaseExtension } from '#packages/common/interface/database.interface';

type FilterTypes = 'all' | 'commands' | 'extensions' | 'scripts';

const filterItems: { id: FilterTypes; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'extensions', name: 'Extensions' },
  { id: 'commands', name: 'Commands' },
  { id: 'scripts', name: 'Scripts' },
];

function RouteExtension() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTypes>('all');

  const [selectedExtensionId, setSelectedExtensionId] = useState('');

  const extensionQuery = useDatabaseQuery({
    name: 'database:get-extension-list',
    args: [],
  });

  const filteredExtensions = (extensionQuery.data ?? []).reduce<
    DatabaseExtension[]
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
            isMatchFilter && command.title.toLowerCase().includes(searchStr)
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
    <div className="p-8">
      <h2 className="text-2xl font-semibold leading-tight -mt-0.5">
        Extensions
      </h2>
      <div className="flex items-center mt-8">
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
          placeholder="Search.."
          onValueChange={setSearch}
        />
      </div>
      <div className="text-sm border mt-4 rounded-lg overflow-hidden flex">
        <div className={`flex-grow ${selectedExtensionId ? 'border-r' : ''}`}>
          <ExtensionListTable
            onExtensionSelected={setSelectedExtensionId}
            extensions={filteredExtensions}
          />
        </div>
        {selectedExtensionId && (
          <div className="w-72 flex-shrink-0">
            <ExtensionDetailCard
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

export default RouteExtension;
