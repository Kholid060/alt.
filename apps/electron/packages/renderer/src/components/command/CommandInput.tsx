import { UiSwitch, useUiList } from '@repo/ui';
import {
  UiListSelectedItem,
  useUiListStore,
} from '@repo/ui/dist/context/list.context';
import { ArrowLeftIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { forwardRef, useRef, useEffect, useCallback, useContext } from 'react';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { mergeRefs } from '/@/utils/helper';
import { ExtensionCommandArgument } from '@repo/extension-core';
import { useCommandStore } from '/@/stores/command.store';
import { CommandListItems } from '/@/interface/command.interface';
import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { CommandRouteContext } from '/@/context/command-route.context';
import preloadAPI from '/@/utils/preloadAPI';

const CommandInputArguments = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    onArgFieldFocus?: (name: string) => void;
    onArgumentsChange?: (
      commandName: string | null,
      args: ExtensionCommandArgument[],
    ) => void;
  }
>(({ onArgumentsChange, onArgFieldFocus, ...props }, ref) => {
  const selectedItem = useUiList(
    (state) => state.selectedItem,
  ) as UiListSelectedItem<CommandListItems['metadata']>;
  const setCommandArgs = useCommandStore((state) => state.setCommandArgs);

  const containerRef = useRef<HTMLDivElement>(null);

  const mergedRefs = mergeRefs(ref, containerRef);
  const selectedCommand =
    selectedItem && selectedItem.metadata?.type === 'command'
      ? selectedItem.metadata
      : null;

  useEffect(() => {
    if (selectedCommand?.command.arguments?.length) {
      setCommandArgs(
        {
          args: {},
          commandId: selectedCommand.command.name,
        },
        true,
      );
    }

    onArgumentsChange?.(
      selectedCommand?.command.title ?? null,
      selectedCommand?.command.arguments ?? [],
    );
  }, [selectedCommand, onArgumentsChange]);

  return (
    <div
      {...props}
      ref={mergedRefs}
      style={{ translate: '0px 0px' }}
      className="flex items-center absolute top-1/2 -translate-y-1/2 left-4 text-sm h-7 gap-2"
    >
      {selectedCommand?.command.arguments?.map((argument) => {
        const key = selectedCommand.command.name + argument.name;
        switch (argument.type) {
          case 'select':
            return (
              <div className="rounded-sm relative max-w-28 h-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <select
                  key={key}
                  required={argument.required}
                  data-command-argument={argument.name}
                  className="appearance-none transition-colors bg-secondary hover:bg-secondary-hover w-full h-full pl-2 pr-6 focus:outline-none rounded-sm"
                  onKeyDownCapture={(event) => {
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                      event.stopPropagation();
                    }
                  }}
                  onChange={(event) => {
                    setCommandArgs({
                      commandId: selectedCommand.command.name,
                      args: { [argument.name]: event.target.value },
                    });
                  }}
                  onFocus={() => onArgFieldFocus?.(argument.name)}
                >
                  <option value="" disabled>
                    {argument.placeholder || 'Select'}
                  </option>
                  {argument.options.map((option) => (
                    <option key={key + option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="h-4 w-4 right-1.5 top-1/2 -translate-y-1/2 absolute" />
              </div>
            );
          case 'input:text':
          case 'input:number':
          case 'input:password': {
            const { 1: type } = argument.type.split(':');
            return (
              <input
                type={type}
                key={key}
                required={argument.required}
                data-command-argument={argument.name}
                placeholder={argument.placeholder}
                className="bg-secondary hover:bg-secondary-hover border-input rounded-sm px-2 max-w-28 h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onFocus={() => onArgFieldFocus?.(argument.name)}
                onChange={(event) => {
                  const target = event.target as HTMLInputElement;
                  setCommandArgs({
                    commandId: selectedCommand.command.name,
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
              <span key={key} className="inline-flex items-center gap-1">
                <UiSwitch
                  size="sm"
                  data-command-argument={argument.name}
                  onFocus={() => onArgFieldFocus?.(argument.name)}
                  onCheckedChange={(checked) => {
                    setCommandArgs({
                      commandId: selectedCommand.command.name,
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

const SEARCH_INPUT_PLACEHOLDER = 'Search extensions or commands...';
const CommandInputTextField = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    onValueChange?: (value: string) => void;
  }
>(({ onValueChange, ...props }, ref) => {
  const query = useUiList((state) => state.search);

  useEffect(() => {
    const inputEl = (ref as React.RefObject<HTMLInputElement>).current;
    if (!inputEl || inputEl.value === query) return;

    inputEl.value = query;
    onValueChange?.(query);
  }, [query]);

  return (
    <input
      type="text"
      ref={ref}
      id="input-query"
      onChange={(event) => onValueChange?.(event.target.value)}
      placeholder={SEARCH_INPUT_PLACEHOLDER}
      className="bg-transparent w-full focus:outline-none h-full flex-grow min-w-56"
      {...props}
    />
  );
});
CommandInputTextField.displayName = 'CommandInputTextField';

const commandKeys = new Set([
  'n',
  'j',
  'p',
  'k',
  'End',
  'Home',
  'Enter',
  'Escape',
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
]);

function CommandInputIcon({ onNavigateBack }: { onNavigateBack?: () => void }) {
  const currentRoute = useCommandRoute((state) => state.currentRoute);

  const isCanNavigateBack = currentRoute?.path !== '';

  return (
    <button
      disabled={!isCanNavigateBack}
      className="h-8 w-8 inline-flex items-center justify-center mr-2 text-muted-foreground flex-shrink-0"
      onKeyDown={(event) => {
        event.stopPropagation();
      }}
      onClick={onNavigateBack}
    >
      {isCanNavigateBack ? (
        <ArrowLeftIcon className="h-5 w-5" />
      ) : (
        <SearchIcon className="h-5 w-5 text-muted-foreground opacity-75" />
      )}
    </button>
  );
}

function CommandInput() {
  const navigate = useCommandNavigate();

  const commandCtx = useCommandCtx();
  const uiListStore = useUiListStore();

  const clearPanel = useCommandPanelStore.use.clearAll();

  const commandRouteCtx = useContext(CommandRouteContext);

  const spanRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const argumentContainerRef = useRef<HTMLDivElement>(null);

  const fallbackFocusToInput = useRef(false);

  const onArgumentsChange = useCallback(
    (commandTitle: string | null, commandArgs: ExtensionCommandArgument[]) => {
      if (!inputRef.current) return;

      if (fallbackFocusToInput.current && commandArgs.length === 0) {
        fallbackFocusToInput.current = false;
        inputRef.current.focus();
      }

      if (
        commandTitle &&
        spanRef.current &&
        !uiListStore.snapshot().search.trim()
      ) {
        moveArgumentContainer(commandTitle);
      }

      inputRef.current.placeholder = commandTitle || SEARCH_INPUT_PLACEHOLDER;
    },
    [],
  );

  function moveArgumentContainer(value: string) {
    if (!spanRef.current) return;

    spanRef.current.textContent = value;

    if (!argumentContainerRef.current) return;

    const { width } = argumentContainerRef.current.getBoundingClientRect();
    const translateX = Math.min(
      window.innerWidth - width - 24, // 24 => left value with padding,
      spanRef.current.offsetWidth,
    );

    argumentContainerRef.current.style.translate = `${translateX}px 0px`;
  }
  function navigateBack() {
    if (commandRouteCtx) {
      const currentRoute = commandRouteCtx.getState().currentRoute;
      if (!currentRoute?.path) {
        preloadAPI.main.invokeIpcMessage('app:close-command-window');
        return;
      }
    }

    clearPanel();
    navigate('');
  }
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
      const { key, ctrlKey, altKey, metaKey, shiftKey } = event;
      messagePort.sendMessage('extension:keydown-event', {
        key,
        altKey,
        ctrlKey,
        metaKey,
        shiftKey,
      });
    }

    switch (event.code) {
      case 'Escape':
        navigateBack();
        break;
      case 'Backspace': {
        if (target.selectionStart !== 0 || target.selectionEnd !== 0) return;

        navigateBack();
        break;
      }
      default:
        uiListStore.listControllerKeyBind(event.nativeEvent);
    }
  }
  function onInputValueChange(value: string) {
    moveArgumentContainer(value);

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
      <CommandInputIcon onNavigateBack={navigateBack} />
      <div className="flex-grow relative h-full">
        <CommandInputTextField
          ref={inputRef}
          onValueChange={onInputValueChange}
        />
        <CommandInputArguments
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
