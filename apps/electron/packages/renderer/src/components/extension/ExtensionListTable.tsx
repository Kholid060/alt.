import {
  UiButton,
  UiDropdownMenu,
  UiDropdownMenuContent,
  UiDropdownMenuItem,
  UiDropdownMenuSeparator,
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
} from '@alt-dot/ui';
import UiExtensionIcon from '../ui/UiExtensionIcon';
import { Fragment, useEffect, useRef, useState } from 'react';
import {
  AlertTriangleIcon,
  BoltIcon,
  ChevronRightIcon,
  EllipsisIcon,
  FileIcon,
  FolderOpenIcon,
  HardDriveIcon,
  LinkIcon,
  RotateCcwIcon,
  StopCircleIcon,
  TrashIcon,
  XIcon,
} from 'lucide-react';
import preloadAPI from '/@/utils/preloadAPI';
import { isIPCEventError } from '/@/utils/helper';
import CommandShortcut from '../ui/UiShortcut';
import { KeyboardShortcutUtils } from '#common/utils/KeyboardShortcutUtils';
import UiShortcut from '../ui/UiShortcut';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import DeepLinkURL from '#packages/common/utils/DeepLinkURL';
import {
  ExtensionCommandListItemModel,
  ExtensionCommandUpdatePayload,
} from '#packages/main/src/extension/extension-command/extension-command.interface';
import {
  ExtensionListItemModel,
  ExtensionUpdatePayload,
} from '#packages/main/src/extension/extension.interface';

interface RecordingShortcutData {
  keys: string;
  isDirty: boolean;
  commandId: string;
  extensionId: string;
}

const buildInExtIds: string[] = Object.values(EXTENSION_BUILT_IN_ID);

function ExtensionCommandList({
  commands,
  extensionId,
  extensionIcon,
  recordingData,
  onUpdateCommand,
  onDeleteCommand,
  extensionDisabled,
  onToggleRecordingShortcut,
}: {
  extensionId: string;
  extensionDisabled: boolean;
  extensionIcon: React.ReactNode;
  commands: ExtensionCommandListItemModel[];
  recordingData: RecordingShortcutData | null;
  onToggleRecordingShortcut?: (commandId: string) => void;
  onUpdateCommand?: (
    commandId: string,
    payload: ExtensionCommandUpdatePayload,
  ) => void;
  onDeleteCommand?: (command: ExtensionCommandListItemModel) => void;
}) {
  const { toast } = useToast();

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
            'group/row border-b border-border/50 hover:bg-card',
            (extensionDisabled || command.isDisabled) && 'opacity-60',
          )}
        >
          <td></td>
          <td className="pr-3">
            <div className="flex items-center border-l border-border/50 py-3 pl-3">
              <div className="relative h-7 w-7 flex-shrink-0">
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
            className="group/shortcut cursor-pointer p-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => onToggleRecordingShortcut?.(command.name)}
            title={
              recordingShortcutData?.commandId === command.name
                ? 'Stop recording'
                : 'Record shortcut'
            }
          >
            {recordingShortcutData?.commandId === command.name ? (
              <div className="flex items-center">
                <span className="relative mr-2 flex h-6 w-6">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/90 opacity-75"></span>
                  <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/90">
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
                  className="invisible ml-2 text-muted-foreground hover:text-foreground group-hover/shortcut:visible"
                  title="Remove shortcut"
                  onClick={(event) => {
                    event.stopPropagation();
                    onUpdateCommand?.(command.name, { shortcut: null });
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

                onUpdateCommand?.(command.name, { alias: value || null });
              }}
              className="w-24 cursor-default rounded-sm border border-transparent bg-transparent p-1 hover:border-border"
            />
          </td>
          <td className="px-3 text-right">
            <div className="flex items-center justify-end gap-2">
              <UiSwitch
                checked={!command.isDisabled}
                size="sm"
                className="align-middle"
                onCheckedChange={(value) =>
                  onUpdateCommand?.(command.name, {
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
                    onClick={() =>
                      preloadAPI.main.ipc
                        .invoke(
                          'clipboard:copy',
                          DeepLinkURL.getExtensionCommand(
                            extensionId,
                            command.name,
                          ),
                        )
                        .then((value) => {
                          if (!isIPCEventError(value)) {
                            toast({
                              title: 'Copied to clipboard',
                            });
                          }
                        })
                    }
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    <span>Copy Deep Link</span>
                  </UiDropdownMenuItem>
                  {command.config && command.config.length > 0 && (
                    <UiDropdownMenuItem
                      onClick={() =>
                        preloadAPI.main.ipc.send(
                          'command-window:input-config',
                          {
                            extensionId,
                            type: 'command',
                            commandId: command.name,
                          },
                        )
                      }
                    >
                      <BoltIcon className="mr-2 h-4 w-4" />
                      <span>Configuration</span>
                    </UiDropdownMenuItem>
                  )}
                  {extensionId === EXTENSION_BUILT_IN_ID.userScript &&
                    command.path && (
                      <>
                        <UiDropdownMenuItem
                          onClick={() =>
                            preloadAPI.main.ipc.invoke(
                              'shell:open-in-folder',
                              command.path!,
                            )
                          }
                        >
                          <FolderOpenIcon className="mr-2 h-4 w-4" />
                          <span>Open file location</span>
                        </UiDropdownMenuItem>
                        <UiDropdownMenuSeparator />
                        <UiDropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteCommand?.(command)}
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          <span>Delete script</span>
                        </UiDropdownMenuItem>
                      </>
                    )}
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

interface ExtensionListTableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  extensions: ExtensionListItemModel[];
  onReloadExtension?: (extensionId: string) => void;
  onExtensionSelected?: (extensionId: string) => void;
  onUpdateExtension?: (
    extensionId: string,
    data: ExtensionUpdatePayload,
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
    data: ExtensionCommandUpdatePayload,
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
  async function deleteCommand(command: ExtensionCommandListItemModel) {
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
    try {
      const result = await preloadAPI.main.ipc.invoke(
        'extension:reload',
        extensionId,
      );
      if (!result) return;
      if (isIPCEventError(result)) {
        toast({
          title: 'Error!',
          variant: 'destructive',
          description: result.message,
        });
      }

      onReloadExtension?.(extensionId);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Something went wrong!',
      });
    }
  }
  async function deleteExtension(extension: ExtensionListItemModel) {
    try {
      const isConfirmed = await dialog.confirm({
        title: 'Delete extension?',
        body: (
          <>
            Are you sure you want to delete <b>&quot;{extension.title}&quot;</b>{' '}
            extension? <br /> This will delete all the extension data and it
            can&apos;t be undone
          </>
        ),
        okText: 'Delete',
        okButtonVariant: 'destructive',
      });
      if (!isConfirmed) return;

      const result = await preloadAPI.main.ipc.invoke(
        'extension:delete',
        extension.id,
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

  useEffect(() => {
    const shortcutRecorder = KeyboardShortcutUtils.createRecorder({
      onChange: (value) => {
        if (value.canceled) {
          setRecordingData(null);
          return;
        }

        if (!recordingData) return;

        const keys = KeyboardShortcutUtils.toElectronShortcut(value.keys);

        preloadAPI.main.ipc
          .invoke(
            'database:update-extension-command',
            recordingData.extensionId,
            recordingData.commandId,
            { shortcut: keys },
          )
          .then((result) => {
            if (isIPCEventError(result)) {
              setRecordingData((prevValue) =>
                prevValue
                  ? {
                      ...prevValue,
                      keys,
                      isDirty: true,
                    }
                  : prevValue,
              );
              return;
            }

            setRecordingData(null);
          });
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
      <thead className="h-12 w-full border-b text-sm">
        <tr className="text-left">
          <th className="h-12 w-8"></th>
          <th className="h-12 pr-3">Name</th>
          <th className="h-12 px-3">Type</th>
          <th className="h-12 px-3">Shortcut</th>
          <th className="h-12 px-3">Alias</th>
          <th className="h-12 w-32 px-3"></th>
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
                  'border-b border-border/50 last:border-b-0 hover:bg-card',
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
                      className={`inline-block h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    />
                  )}
                </td>
                <td className="py-3 pr-3">
                  <div className="flex items-center">
                    <div className="relative h-7 w-7 flex-shrink-0">
                      {extension.isLocal && (
                        <span className="absolute -left-2 -top-2 rounded-full bg-orange-500 p-0.5">
                          <HardDriveIcon className="size-[14px] stroke-black" />
                        </span>
                      )}
                      {extensionIcon}
                    </div>
                    <p className="ml-2">
                      {extension.title}{' '}
                      <span className="ml-1 text-muted-foreground">
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
                          <pre className="mt-2 overflow-auto whitespace-pre-wrap rounded-lg bg-background p-3 text-sm text-muted-foreground">
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
                        {extension.config && extension.config.length > 0 && (
                          <UiDropdownMenuItem
                            onClick={() =>
                              preloadAPI.main.ipc.send(
                                'command-window:input-config',
                                {
                                  commandId: '',
                                  type: 'extension',
                                  extensionId: extension.id,
                                },
                              )
                            }
                          >
                            <BoltIcon className="mr-2 h-4 w-4" />
                            <span>Configuration</span>
                          </UiDropdownMenuItem>
                        )}
                        <UiDropdownMenuItem
                          onClick={() => onExtensionSelected?.(extension.id)}
                        >
                          <FileIcon className="mr-2 h-4 w-4" />
                          <span>See details</span>
                        </UiDropdownMenuItem>
                        {extension.isLocal && (
                          <UiDropdownMenuItem
                            onClick={() => reloadExtension(extension.id)}
                          >
                            <RotateCcwIcon className="mr-2 h-4 w-4" />
                            <span>Reload</span>
                          </UiDropdownMenuItem>
                        )}
                        {!buildInExtIds.includes(extension.id) && (
                          <>
                            <UiDropdownMenuSeparator />
                            <UiDropdownMenuItem
                              variant="destructive"
                              onClick={() => deleteExtension(extension)}
                            >
                              <TrashIcon className="mr-2 h-4 w-4" />
                              <span>Delete</span>
                            </UiDropdownMenuItem>
                          </>
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
                  extensionDisabled={extension.isDisabled}
                  onUpdateCommand={(commandId, payload) =>
                    updateCommand(extension.id, commandId, payload)
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
