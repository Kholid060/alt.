import { UiSwitch, useUiList } from '@repo/ui';
import {
  UiListSelectedItem,
  useUiListStore,
} from '@repo/ui/dist/context/list.context';
import { SearchIcon } from 'lucide-react';
import { forwardRef, RefObject, useRef, useEffect, useCallback } from 'react';
import { CommandListItemMetadata } from './CommandList';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { useCommandRouteStore } from '/@/stores/command-route.store';
import { mergeRefs } from '/@/utils/helper';
import { ExtensionCommandArgument } from '@repo/extension-core';

function ArgumentInputComponent({
  type,
  argument,
  ...props
}: React.HTMLAttributes<HTMLInputElement> & {
  argument: ExtensionCommandArgument;
  type?: string;
}) {
  return (
    <input
      key={argument.name}
      type={type}
      required={argument.required}
      data-command-argument={argument.name}
      placeholder={argument.placeholder}
      className="bg-secondary hover:bg-secondary-hover highlight-white/5 border-input rounded-[6px] px-2 max-w-28 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      {...props}
    />
  );
}

const CommandInputArguments = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    widthRef: RefObject<HTMLSpanElement>;
    onArgFieldFocus?: (name: string) => void;
    onArgumentsChange?: (args: ExtensionCommandArgument[]) => void;
  }
>(({ widthRef, onArgumentsChange, onArgFieldFocus, ...props }, ref) => {
  const selectedItem = useUiList(
    (state) => state.selectedItem,
  ) as UiListSelectedItem<CommandListItemMetadata>;

  const commandCtx = useCommandCtx();

  const containerRef = useRef<HTMLDivElement>(null);

  const mergedRefs = mergeRefs(ref, containerRef);
  const selectedCommand =
    selectedItem && selectedItem.metadata.type === 'extension-command'
      ? selectedItem.metadata.command
      : null;

  const defaultFormValue: Record<string, unknown> =
    commandCtx.extCommandArgs.current?.commandId === selectedCommand?.name
      ? commandCtx.extCommandArgs.current?.args ?? {}
      : {};

  useEffect(() => {
    if (selectedCommand?.arguments?.length) {
      commandCtx.setExtCommandArgs(
        {
          args: {},
          commandId: selectedCommand.name,
        },
        selectedCommand.name !== commandCtx.extCommandArgs.current?.commandId,
      );
    }

    onArgumentsChange?.(selectedCommand?.arguments ?? []);
  }, [selectedCommand, onArgumentsChange]);

  if (!selectedCommand?.arguments?.length) return null;

  return (
    <div
      {...props}
      ref={mergedRefs}
      style={{ translate: `${widthRef.current?.offsetWidth ?? 0}px 0` }}
      className="flex items-center absolute top-1/2 -translate-y-1/2 left-4 text-sm h-7 gap-2"
    >
      {selectedCommand?.arguments?.map((argument) => {
        switch (argument.type) {
          case 'select':
            return (
              <select
                key={argument.name}
                required={argument.required}
                data-command-argument={argument.name}
                defaultValue={(defaultFormValue[argument.name] as string) ?? ''}
                className="bg-secondary hover:bg-secondary-hover highlight-white/5 rounded-[6px] px-2 max-w-28 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onKeyDownCapture={(event) => {
                  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.stopPropagation();
                  }
                }}
                onChange={(event) => {
                  commandCtx.setExtCommandArgs({
                    args: { [argument.name]: event.target.value },
                  });
                }}
                onFocus={() => onArgFieldFocus?.(argument.name)}
              >
                <option value="" disabled>
                  {argument.placeholder || 'Select'}
                </option>
                {argument.options.map((option) => (
                  <option
                    key={argument.name + option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            );
          case 'input:text':
          case 'input:number': {
            const { 1: type } = argument.type.split(':');
            return (
              <ArgumentInputComponent
                type={type}
                key={argument.name}
                argument={argument}
                onFocus={() => onArgFieldFocus?.(argument.name)}
                onChange={(event) => {
                  const target = event.target as HTMLInputElement;
                  commandCtx.setExtCommandArgs({
                    args: {
                      [argument.name]:
                        type === 'number' ? target.valueAsNumber : target.value,
                    },
                  });
                }}
              />
            );
          }
          case 'toggle':
            return (
              <span
                key={argument.name}
                className="inline-flex items-center gap-1"
              >
                <UiSwitch
                  data-command-argument={argument.name}
                  onFocus={() => onArgFieldFocus?.(argument.name)}
                  defaultChecked={Boolean(defaultFormValue[argument.name])}
                  onCheckedChange={(checked) => {
                    commandCtx.setExtCommandArgs({
                      args: { [argument.name]: checked },
                    });
                  }}
                  className="data-[state=unchecked]:bg-secondary-selected"
                />
                <span className="line-clamp-1 max-w-28">
                  {argument.placeholder}
                </span>
              </span>
            );
          default:
            return null;
        }
      })}
    </div>
  );
});
CommandInputArguments.displayName = 'CommandInputArguments';

const commandKeys = new Set([
  'n',
  'j',
  'ArrowDown',
  'p',
  'k',
  'ArrowUp',
  'Home',
  'End',
  'Enter',
]);

function CommandInput() {
  const navigate = useCommandRouteStore((state) => state.navigate);

  const commandCtx = useCommandCtx();
  const uiListStore = useUiListStore();

  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const argumentContainerRef = useRef<HTMLDivElement>(null);

  const fallbackFocusToInput = useRef(false);

  const onArgumentsChange = useCallback(
    (commandArgs: ExtensionCommandArgument[]) => {
      if (!inputRef.current) return;

      if (fallbackFocusToInput.current && commandArgs.length === 0) {
        fallbackFocusToInput.current = false;
        inputRef.current.focus();
      }

      inputRef.current.classList.toggle(
        'placeholder:text-transparent',
        commandArgs.length > 0,
      );
    },
    [],
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    if (target.dataset.commandArgument && event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      uiListStore.listController.current?.selectItem();
      return;
    }

    const messagePort = commandCtx.extMessagePort.current;
    if (messagePort && commandKeys.has(event.key)) {
      const { key, ctrlKey, altKey, metaKey } = event;
      messagePort.sendMessage('extension:keydown-event', {
        key,
        altKey,
        ctrlKey,
        metaKey,
        isComposing: event.nativeEvent.isComposing,
      });
    }

    switch (event.code) {
      case 'Backspace': {
        if (target.selectionStart !== 0 || target.selectionEnd !== 0) return;

        let { breadcrumbs } = useCommandRouteStore.getState();
        if (breadcrumbs.length === 0) return;

        breadcrumbs = [...breadcrumbs];
        breadcrumbs.pop();

        navigate(breadcrumbs.at(-1)?.path ?? '', {
          breadcrumbs,
        });
        break;
      }
      default:
        uiListStore.listControllerKeyBind(event.nativeEvent);
    }
  }
  function onInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const target = event.target as HTMLInputElement;
    const { value } = target;

    if (spanRef.current) {
      spanRef.current.textContent = value;

      if (argumentContainerRef.current) {
        const { width } = argumentContainerRef.current.getBoundingClientRect();
        const translateX = Math.min(
          window.innerWidth - width - 24, // 24 => left value with padding,
          spanRef.current.offsetWidth,
        );

        argumentContainerRef.current.style.translate = `${translateX}px 0px`;
      }
    }

    const messagePort = commandCtx.extMessagePort.current;
    if (messagePort) {
      messagePort.sendMessage('extension:query-change', value);
    }

    uiListStore.setState('search', value);
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="flex items-center px-4 h-12 focus:outline-none"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <span className="h-8 w-8 inline-flex items-center justify-center mr-2 flex-shrink-0">
        <SearchIcon className="h-5 w-5 text-muted-foreground opacity-75" />
      </span>
      <div className="flex-grow relative h-full">
        <input
          type="text"
          ref={inputRef}
          id="input-query"
          placeholder="Search extensions or commands..."
          className="bg-transparent w-full focus:outline-none h-full flex-grow min-w-56"
          onChange={onInputChange}
        />
        <CommandInputArguments
          widthRef={spanRef}
          ref={argumentContainerRef}
          onArgumentsChange={onArgumentsChange}
          style={{ left: spanRef.current?.offsetWidth ?? 56 }}
          onArgFieldFocus={() => (fallbackFocusToInput.current = true)}
        />
      </div>
      <span
        aria-hidden="true"
        className="bg-transparent text-transparent -z-50 absolute pointer-events-none"
        ref={spanRef}
      ></span>
    </div>
  );
}

export default CommandInput;
