import { ExtensionData } from '#packages/common/interface/extension.interface';
import { UiButton, UiList, UiSwitch, cn } from '@repo/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { Fragment, useState } from 'react';
import { ChevronRightIcon, ExternalLinkIcon } from 'lucide-react';

interface ExtensionListTableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  extensions: ExtensionData[];
}
function ExtensionListTable({
  extensions,
  className,
  ...props
}: ExtensionListTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  return (
    <table
      className={cn('table-auto w-full cursor-default', className)}
      {...props}
    >
      <thead className="text-sm border-b w-full">
        <tr>
          <th className="text-left h-12 w-8"></th>
          <th className="text-left h-12 pr-4">Name</th>
          <th className="text-left h-12 px-4">Type</th>
          <th className="text-left h-12 px-4">Shortcut</th>
          <th className="h-12 px-4 w-24"></th>
        </tr>
      </thead>
      <tbody>
        {extensions.map((extension) => (
          <Fragment key={extension.id}>
            <tr
              className="hover:bg-card border-b border-border/50 last:border-b-0"
              onClick={() => {
                if (extension.isError) return;

                setExpandedRows((prevVal) => {
                  const newVal = new Set(prevVal);
                  if (prevVal.has(extension.id)) {
                    newVal.delete(extension.id);
                  } else {
                    newVal.add(extension.id);
                  }
                  return newVal;
                });
              }}
            >
              <td className="py-4 text-center">
                {!extension.isError && (
                  <ChevronRightIcon
                    className={`h-5 w-5 inline-block transition-transform ${expandedRows.has(extension.id) ? 'rotate-90' : ''}`}
                  />
                )}
              </td>
              <td className="pr-4">
                <div className="flex items-center">
                  <div className="h-7 w-7">
                    {extension.isError ? (
                      <UiList.Icon icon={extension.title[0].toUpperCase()} />
                    ) : (
                      <UiExtensionIcon
                        alt={`${extension.title} icon`}
                        id={extension.id}
                        icon={extension.manifest.icon}
                        iconWrapper={(icon) => <UiList.Icon icon={icon} />}
                      />
                    )}
                  </div>
                  <p className="ml-2">
                    {extension.title}{' '}
                    <span className="text-muted-foreground ml-1">
                      {extension.version}
                    </span>
                  </p>
                </div>
              </td>
              <td className="p-4">Extension</td>
              <td className="p-4 text-muted-foreground">━</td>
              <td className="p-4 text-right" align="center">
                <UiButton size="icon-sm" variant="ghost">
                  <ExternalLinkIcon />
                </UiButton>
                <UiSwitch size="sm" className="align-middle" />
              </td>
            </tr>
            {expandedRows.has(extension.id) &&
              !extension.isError &&
              extension.manifest.commands.map((command) => (
                <tr key={extension.id + command.name}>
                  <td></td>
                  <td>{command.name}</td>
                </tr>
              ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

export default ExtensionListTable;
