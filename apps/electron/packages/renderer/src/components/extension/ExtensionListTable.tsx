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
import { isIPCEventError } from '#packages/common/utils/helper';

interface ExtensionListTableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  extensions: ExtensionData[];
  onExtensionSelected?: (extensionId: string) => void;
  onReloadExtension?: (extension: ExtensionData) => void;
}
function ExtensionListTable({
  className,
  extensions,
  onReloadExtension,
  onExtensionSelected,
  ...props
}: ExtensionListTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  async function reloadExtension(extensionId: string) {
    const result = await preloadAPI.main.invokeIpcMessage(
      'extension:reload',
      extensionId,
    );
    if (!result || isIPCEventError(result)) return;

    onReloadExtension?.(result);
  }

  return (
    <table
      className={cn('table-auto w-full cursor-default', className)}
      {...props}
    >
      <thead className="text-sm border-b h-12 w-full">
        <tr className="text-left">
          <th className="h-12 w-8"></th>
          <th className="h-12 pr-3">Name</th>
          <th className="h-12 px-3">Type</th>
          <th className="h-12 px-3">Shortcut</th>
          <th className="h-12 px-3 w-32"></th>
        </tr>
      </thead>
      <tbody>
        {extensions.length === 0 && (
          <tr>
            <td colSpan={99} className="p-3 text-center text-muted-foreground">
              No data
            </td>
          </tr>
        )}
        {extensions.map((extension) => {
          const extensionIcon = extension.isError ? (
            <UiList.Icon icon={extension.title[0].toUpperCase()} />
          ) : (
            <UiExtensionIcon
              alt={`${extension.title} icon`}
              id={extension.id}
              icon={extension.manifest.icon}
              iconWrapper={(icon) => <UiList.Icon icon={icon} />}
            />
          );
          const isExpanded = expandedRows.has(extension.id);

          return (
            <Fragment key={extension.id}>
              <tr
                className={`hover:bg-card border-b border-border/50 last:border-b-0 ${isExpanded ? 'bg-card' : ''}`}
                onClick={() => {
                  onExtensionSelected?.(extension.id);

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
                      className={`h-5 w-5 inline-block transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  )}
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center">
                    <div className="h-7 w-7 flex-shrink-0">{extensionIcon}</div>
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
                <td
                  className="p-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-end">
                    {extension.isError && (
                      <UiPopover>
                        <UiTooltip label="See error">
                          <UiPopoverTrigger asChild>
                            <UiButton
                              size="icon-sm"
                              variant="ghost"
                              className="mr-2 h-8 w-8"
                            >
                              <AlertTriangleIcon className="h-5 w-5 text-destructive-text" />
                            </UiButton>
                          </UiPopoverTrigger>
                        </UiTooltip>
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
                    <UiSwitch
                      checked={!extension.isDisabled}
                      size="sm"
                      className="align-middle"
                    />
                  </div>
                </td>
              </tr>
              {isExpanded &&
                !extension.isError &&
                extension.manifest.commands.map((command) => (
                  <tr
                    key={extension.id + command.name}
                    className="border-b border-border/50 hover:bg-card"
                  >
                    <td className="relative">
                      {/* <span className="absolute w-4/12 left-1/2 h-px bg-border" /> */}
                    </td>
                    <td className="pr-3 py-3">
                      <div className="flex items-center">
                        <div className="h-7 w-7 flex-shrink-0">
                          {command.icon ? (
                            <UiExtensionIcon
                              id={extension.id}
                              alt={command.name + ' icon'}
                              icon={command.icon}
                              iconWrapper={(icon) => (
                                <UiList.Icon icon={icon} />
                              )}
                            />
                          ) : (
                            extensionIcon
                          )}
                        </div>
                        <span className="ml-2">{command.title}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      {command.type === 'script' ? 'Script' : 'Command'}
                    </td>
                    <td className="p-3 cursor-pointer text-muted-foreground text-sm">
                      Record Shortcut
                    </td>
                    <td></td>
                  </tr>
                ))}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

export default ExtensionListTable;
