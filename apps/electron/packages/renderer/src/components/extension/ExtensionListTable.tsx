import { ExtensionData } from '#packages/common/interface/extension.interface';
import {
  UiButton,
  UiList,
  UiPopover,
  UiPopoverContent,
  UiPopoverTrigger,
  UiSwitch,
  UiTooltip,
  cn,
} from '@repo/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { Fragment, useState } from 'react';
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  RotateCcwIcon,
} from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';

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

  async function reloadExtension(extensionId: string) {
    const result = await preloadAPI.main.invokeIpcMessage(
      'extension:reload',
      extensionId,
    );
    if (!result) return;

    console.log(result);
  }

  return (
    <table
      className={cn('table-auto w-full cursor-default', className)}
      {...props}
    >
      <thead className="text-sm border-b w-full">
        <tr>
          <th className="text-left h-12 w-8"></th>
          <th className="text-left h-12 pr-3">Name</th>
          <th className="text-left h-12 px-3">Type</th>
          <th className="text-left h-12 px-3">Shortcut</th>
          <th className="h-12 px-3 w-32"></th>
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
              <td className="py-3 text-center">
                {!extension.isError && (
                  <ChevronRightIcon
                    className={`h-5 w-5 inline-block transition-transform ${expandedRows.has(extension.id) ? 'rotate-90' : ''}`}
                  />
                )}
              </td>
              <td className="py-3 pr-3">
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
              <td className="p-3">Extension</td>
              <td className="p-3 text-muted-foreground">━</td>
              <td className="p-3 text-right" align="center">
                <div className="flex items-center">
                  {extension.isError && (
                    <UiPopover>
                      <UiPopoverTrigger>
                        <UiTooltip label="See error">
                          <UiButton
                            size="icon-sm"
                            variant="ghost"
                            className="mr-2 h-8 w-8"
                            onClick={() => reloadExtension(extension.id)}
                          >
                            <AlertTriangleIcon className="h-5 w-5 text-destructive-text" />
                          </UiButton>
                        </UiTooltip>
                      </UiPopoverTrigger>
                      <UiPopoverContent>
                        <p>Extension Error</p>
                        <pre className="bg-background p-3 rounded-lg mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                          {extension.errorMessage}
                        </pre>
                      </UiPopoverContent>
                    </UiPopover>
                  )}
                  {extension.isLocal && (
                    <UiTooltip label="Reload extension">
                      <UiButton
                        size="icon-sm"
                        variant="ghost"
                        className="mr-4 h-8 w-8"
                        onClick={() => reloadExtension(extension.id)}
                      >
                        <RotateCcwIcon className="h-5 w-5" />
                      </UiButton>
                    </UiTooltip>
                  )}
                  <UiSwitch size="sm" className="align-middle" />
                </div>
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
