import {
  UiButton,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuTrigger,
  UiList,
  UiPopover,
  UiPopoverContent,
  UiPopoverTrigger,
  UiSwitch,
  UiTooltip,
  cn,
  useDialog,
  useToast,
} from '@repo/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  AlertTriangleIcon,
  ChevronRightIcon,
  EllipsisIcon,
  FileIcon,
  FolderOpenIcon,
  RotateCcwIcon,
  StopCircleIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '/@/utils/helper';
import {
  DatabaseExtensionCommand,
  DatabaseExtensionListItem,
  DatabaseExtensionCommandUpdatePayload,
  DatabaseExtensionUpdatePayload,
} from '#packages/main/src/interface/database.interface';
import CommandShortcut from '../ui/UiShortcut';
import { KeyboardShortcutUtils } from '#common/utils/KeyboardShortcutUtils';
import UiShortcut from '../ui/UiShortcut';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';

interface RecordingShortcutData {
  keys: string;
  isDirty: boolean;
  commandId: string;
  extensionId: string;
}

function ExtensionCommandList({
  commands,
  extensionId,
  extensionIcon,
  recordingData,
  onUpdateAlias,
  onDeleteCommand,
  onRemoveShortcut,
  extensionDisabled,
  onToggleRecordingShortcut,
}: {
  extensionId: string;
  extensionDisabled: boolean;
  extensionIcon: React.ReactNode;
  commands: DatabaseExtensionCommand[];
  recordingData: RecordingShortcutData | null;
  onRemoveShortcut?: (commandId: string) => void;
  onToggleRecordingShortcut?: (commandId: string) => void;
  onUpdateAlias?: (commandId: string, alias: string | null) => void;
  onDeleteCommand?: (command: DatabaseExtensionCommand) => void;
}) {
  const commandAlias = useRef({ id: '', alias: '' });

  const recordingShortcutData =
    recordingData && recordingData.extensionId === extensionId
      ? recordingData
      : null;

  return (
    <>
      {commands.map((command) => (
        <tr
          key={extensionId + command.name}
          className={cn(
            'border-b border-border/50 hover:bg-card group/row',
            extensionDisabled && 'opacity-60',
          )}
        >
          <td></td>
          <td className="pr-3">
            <div className="flex items-center py-3 border-l border-border/50 pl-3">
              <div className="h-7 w-7 flex-shrink-0">
                {command.icon ? (
                  <UiExtensionIcon
                    id={extensionId}
                    alt={command.name + ' icon'}
                    icon={command.icon}
                    iconWrapper={(icon) => <UiList.Icon icon={icon} />}
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
          <td
            className="p-3 text-muted-foreground text-sm transition-colors hover:text-foreground group/shortcut cursor-pointer"
            onClick={() => onToggleRecordingShortcut?.(command.name)}
            title={
              recordingShortcutData?.commandId === command.name
                ? 'Stop recording'
                : 'Record shortcut'
            }
          >
            {recordingShortcutData?.commandId === command.name ? (
              <div className="flex items-center">
                <span className="relative flex h-6 w-6 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/90 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-primary/90 items-center justify-center">
                    <StopCircleIcon className="h-4 w-4 text-foreground" />
                  </span>
                </span>
                <span className="text-foreground">
                  {recordingShortcutData.keys.length ? (
                    <UiShortcut shortcut={recordingShortcutData.keys} />
                  ) : (
                    'Stop recording'
                  )}
                </span>
              </div>
            ) : command.shortcut ? (
              <div className="flex items-center">
                <CommandShortcut shortcut={command.shortcut} />
                <button
                  className="invisible group-hover/shortcut:visible ml-2 text-muted-foreground hover:text-foreground"
                  title="Remove shortcut"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemoveShortcut?.(command.name);
                  }}
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ) : (
              'Record Shortcut'
            )}
          </td>
          <td className="p-3">
            <input
              type="text"
              defaultValue={command.alias ?? ''}
              placeholder="Add alias"
              max="12"
              maxLength={6}
              onFocus={() => {
                commandAlias.current = {
                  id: command.name,
                  alias: command.alias ?? '',
                };
              }}
              onBlur={(event) => {
                const value = event.target.value.trim();
                if (
                  command.name === commandAlias.current.id &&
                  value === commandAlias.current.alias
                ) {
                  return;
                }

                onUpdateAlias?.(command.name, value || null);
              }}
              className="w-24 p-1 rounded-sm bg-transparent hover:border-border border-transparent border cursor-default"
            />
          </td>
          <td className="text-right px-3">
            {extensionId === EXTENSION_BUILT_IN_ID.userScript &&
              command.path && (
                <div className="invisible space-x-1 group-hover/row:visible">
                  <UiTooltip label="Open file location">
                    <UiButton
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        preloadAPI.main.ipc.invoke(
                          'shell:open-in-folder',
                          command.path!,
                        )
                      }
                    >
                      <FolderOpenIcon className="h-5 w-5" />
                    </UiButton>
                  </UiTooltip>
                  <UiTooltip label="Delete script">
                    <UiButton
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDeleteCommand?.(command)}
                    >
                      <TrashIcon className="h-5 w-5 text-destructive-text" />
                    </UiButton>
                  </UiTooltip>
                </div>
              )}
          </td>
        </tr>
      ))}
    </>
  );
}

interface ExtensionListTableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  extensions: DatabaseExtensionListItem[];
  onExtensionSelected?: (extensionId: string) => void;
  onReloadExtension?: (extension: DatabaseExtensionListItem) => void;
  onUpdateExtension?: (
    extensionId: string,
    data: DatabaseExtensionUpdatePayload,
  ) => void;
}
function ExtensionListTable({
  className,
  extensions,
  onReloadExtension,
  onUpdateExtension,
  onExtensionSelected,
  ...props
}: ExtensionListTableProps) {
  const dialog = useDialog();
  const { toast } = useToast();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [recordingData, setRecordingData] =
    useState<null | RecordingShortcutData>(null);

  async function toggleRecording(extensionId: string, commandId: string) {
    try {
      if (
        !recordingData ||
        recordingData.extensionId !== extensionId ||
        recordingData.commandId !== commandId
      ) {
        setRecordingData({ keys: '', commandId, extensionId, isDirty: false });
        return;
      } else if (!recordingData.isDirty) {
        setRecordingData(null);
        return;
      }

      await preloadAPI.main.ipc.invoke(
        'database:update-extension-command',
        extensionId,
        recordingData.commandId,
        { shortcut: recordingData.keys },
      );

      setRecordingData(null);
    } catch (error) {
      console.error(error);

      if (!(error instanceof Error)) return;

      toast({
        title: 'Error!',
        variant: 'destructive',
        description: error.message.includes('UNIQUE constraint')
          ? 'This shortcut is already been used'
          : 'Something went wrong',
      });
    }
  }
  async function updateCommand(
    extensionId: string,
    commandId: string,
    data: DatabaseExtensionCommandUpdatePayload,
  ) {
    try {
      const result = await preloadAPI.main.ipc.invoke(
        'database:update-extension-command',
        extensionId,
        commandId,
        data,
      );
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: 'Something went wrong',
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error!',
        variant: 'destructive',
        description: 'Something went wrong',
      });
    }
  }
  async function deleteCommand(command: DatabaseExtensionCommand) {
    try {
      const isConfirmed = await dialog.confirm({
        title: 'Delete script?',
        body: (
          <>
            Are you sure you want to delete <b>&quot;{command.title}&quot;</b>{' '}
            script?
          </>
        ),
        okText: 'Delete',
        okButtonVariant: 'destructive',
      });
      if (!isConfirmed) return;

      const result = await preloadAPI.main.ipc.invoke(
        'database:delete-extension-command',
        command.id,
      );
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong!',
      });
    }
  }
  async function reloadExtension(extensionId: string) {
    const result = await preloadAPI.main.ipc.invoke(
      'extension:reload',
      extensionId,
    );
    if (!result || isIPCEventError(result)) return;

    onReloadExtension?.(result);
  }

  useEffect(() => {
    const shortcutRecorder = KeyboardShortcutUtils.createRecorder({
      onChange: (value) => {
        if (value.canceled) {
          setRecordingData(null);
          return;
        }

        setRecordingData((prevValue) =>
          prevValue
            ? {
                ...prevValue,
                isDirty: true,
                keys: KeyboardShortcutUtils.toElectronShortcut(value.keys),
              }
            : prevValue,
        );
      },
    });

    if (recordingData) {
      window.addEventListener('keydown', shortcutRecorder);
    }

    return () => {
      window.removeEventListener('keydown', shortcutRecorder);
    };
  }, [recordingData]);

  return (
    <table className={cn('w-full cursor-default', className)} {...props}>
      <thead className="text-sm border-b h-12 w-full">
        <tr className="text-left">
          <th className="h-12 w-8"></th>
          <th className="h-12 pr-3">Name</th>
          <th className="h-12 px-3">Type</th>
          <th className="h-12 px-3">Shortcut</th>
          <th className="h-12 px-3">Alias</th>
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
              icon={extension.icon}
              iconWrapper={(icon) => <UiList.Icon icon={icon} />}
            />
          );
          const isExpanded = expandedRows.has(extension.id);

          return (
            <Fragment key={extension.id}>
              <tr
                className={cn(
                  'hover:bg-card border-b border-border/50 last:border-b-0',
                  isExpanded && 'bg-card',
                  extension.isDisabled && 'opacity-60',
                )}
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
                <td className="p-3 text-muted-foreground">━</td>
                <td
                  className="p-3"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-2">
                    {extension.isError && (
                      <UiPopover>
                        <UiTooltip label="See error">
                          <UiPopoverTrigger asChild>
                            <UiButton size="icon-sm" variant="ghost">
                              <AlertTriangleIcon className="h-5 w-5 text-destructive-text" />
                            </UiButton>
                          </UiPopoverTrigger>
                        </UiTooltip>
                        <UiPopoverContent>
                          <p>Extension Error</p>
                          <pre className="bg-background overflow-auto p-3 rounded-lg mt-2 text-sm whitespace-pre-wrap text-muted-foreground">
                            {extension.errorMessage}
                          </pre>
                        </UiPopoverContent>
                      </UiPopover>
                    )}
                    <UiSwitch
                      checked={!extension.isDisabled}
                      size="sm"
                      className="align-middle"
                      onCheckedChange={(value) =>
                        onUpdateExtension?.(extension.id, {
                          isDisabled: !value,
                        })
                      }
                    />
                    <UiDropdownMenu>
                      <UiDropdownMenuTrigger asChild>
                        <UiButton variant="ghost" size="icon-sm">
                          <EllipsisIcon className="h-5 w-5" />
                        </UiButton>
                      </UiDropdownMenuTrigger>
                      <UiDropdownMenuContent align="end" className="min-w-32">
                        <UiDropdownMenuItem
                          onClick={() => onExtensionSelected?.(extension.id)}
                        >
                          <FileIcon className="h-4 w-4 mr-2" />
                          <span>See details</span>
                        </UiDropdownMenuItem>
                        {extension.isLocal && (
                          <UiDropdownMenuItem
                            onClick={() => reloadExtension(extension.id)}
                          >
                            <RotateCcwIcon className="h-4 w-4 mr-2" />
                            <span>Reload</span>
                          </UiDropdownMenuItem>
                        )}
                      </UiDropdownMenuContent>
                    </UiDropdownMenu>
                  </div>
                </td>
              </tr>
              {isExpanded && !extension.isError && (
                <ExtensionCommandList
                  extensionId={extension.id}
                  commands={extension.commands}
                  extensionIcon={extensionIcon}
                  recordingData={recordingData}
                  onDeleteCommand={deleteCommand}
                  onUpdateAlias={(commandId, alias) =>
                    updateCommand(extension.id, commandId, { alias })
                  }
                  extensionDisabled={extension.isDisabled}
                  onRemoveShortcut={(commandId) =>
                    updateCommand(extension.id, commandId, { shortcut: null })
                  }
                  onToggleRecordingShortcut={(commandId) =>
                    toggleRecording(extension.id, commandId)
                  }
                />
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

export default ExtensionListTable;
