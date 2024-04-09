import { LoaderFunction, useLoaderData } from 'react-router-dom';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '#packages/common/utils/helper';
import { ExtensionData } from '#packages/common/interface/extension.interface';
import { UiInput, UiToggleGroup, UiToggleGroupItem } from '@repo/ui';
import { useState } from 'react';
import { SearchIcon } from 'lucide-react';
import ExtensionListTable from '/@/components/extension/ExtensionListTable';

type FilterTypes = 'all' | 'commands' | 'extensions' | 'scripts';

const filterItems: { id: FilterTypes; name: string }[] = [
  { id: 'all', name: 'All' },
  { id: 'extensions', name: 'Extensions' },
  { id: 'commands', name: 'Commands' },
  { id: 'scripts', name: 'Scripts' },
];

function RouteExtension() {
  const extensions = useLoaderData() as ExtensionData[];

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTypes>('all');

  return (
    <div className="p-8">
      <h2 className="text-2xl font-semibold leading-tight -mt-0.5">
        Extensions
      </h2>
      <div className="flex items-center mt-8 justify-between">
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
        <UiInput
          value={search}
          prefixIcon={<SearchIcon className="h-5 w-5" />}
          className="w-64"
          placeholder="Search.."
          onValueChange={setSearch}
        />
      </div>
      <div className="border mt-4 rounded-lg overflow-hidden flex">
        <ExtensionListTable extensions={extensions} />
        <div className="w-96 p-4 h-full">
          <p>Extension detail</p>
        </div>
      </div>
    </div>
  );
}

export const extensionLoader: LoaderFunction = async () => {
  const extensions = await preloadAPI.main.invokeIpcMessage('extension:list');
  if (isIPCEventError(extensions)) return [];

  return extensions;
};

export default RouteExtension;
