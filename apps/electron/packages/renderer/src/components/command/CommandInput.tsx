import { UiSwitch, useUiList } from '@altdot/ui';
import {
  UiListSelectedItem,
  useUiListStore,
} from '@altdot/ui/dist/context/list.context';
import { ArrowLeftIcon, ChevronDownIcon, SearchIcon } from 'lucide-react';
import { forwardRef, useRef, useEffect, useCallback, useContext } from 'react';
import { useCommandCtx } from '/@/hooks/useCommandCtx';
import { ExtensionCommandArgument } from '@altdot/extension';
import { useCommandStore } from '/@/stores/command.store';
import { CommandListItems } from '/@/interface/command.interface';
import { useCommandNavigate, useCommandRoute } from '/@/hooks/useCommandRoute';
import { useCommandPanelStore } from '/@/stores/command-panel.store';
import { CommandRouteContext } from '/@/context/command-route.context';
import preloadAPI from '/@/utils/preloadAPI';
import { ExtensionAPI } from '@altdot/extension';
import { useShallow } from 'zustand/react/shallow';

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
  const [args, setCommandArgs] = useCommandStore(
    useShallow((state) => [state.commandArgs.args, state.setCommandArgs]),
  );

  const selectedCommand =
    selectedItem && selectedItem.metadata?.type === 'command'
      ? selectedItem.metadata
      : null;

  useEffect(() => {
    const clearArgs =
      selectedCommand?.command.arguments?.length &&
      useCommandStore.getState().commandArgs.commandId;
    if (clearArgs) {
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
  }, [selectedCommand, onArgumentsChange, setCommandArgs]);

  return (
    <div
      {...props}
      ref={ref}
      style={{ translate: '0px 0px' }}
      className="absolute left-4 top-1/2 flex h-7 -translate-y-1/2 items-center gap-2 text-sm"
    >
      {selectedCommand?.command.arguments?.map((argument) => {
        const key = selectedCommand.command.id + argument.name;

        switch (argument.type) {
          case 'select':
            return (
              <div className="relative h-full max-w-28 rounded-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
                <select
                  key={key}
                  value={`${args[argument.name] ?? ''}`}
                  required={argument.required}
                  data-command-argument={argument.name}
                  className="h-full w-full appearance-none rounded-sm bg-secondary pl-2 pr-6 transition-colors hover:bg-secondary-hover focus:outline-none"
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
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="pointer-events-none absolute right-1.5 top-1/2 h-4 w-4 -translate-y-1/2" />
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
                value={`${args[argument.name] ?? ''}`}
                required={argument.required}
                data-command-argument={argument.name}
                placeholder={argument.placeholder}
                className="h-full max-w-28 rounded-sm border-input bg-secondary px-2 hover:bg-secondary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
                  checked={Boolean(args[argument.name] ?? false)}
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

const SEARCH_INPUT_PLACEHOLDER = 'Search...';
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
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus
      onChange={(event) => onValueChange?.(event.target.value)}
      placeholder={SEARCH_INPUT_PLACEHOLDER}
      className="h-full w-full min-w-56 flex-grow bg-transparent focus:outline-none"
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
      className="mr-2 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center text-muted-foreground"
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
        preloadAPI.main.ipc.invoke('command-window:close');
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

    const messagePort = commandCtx.runnerMessagePort.current;
    const viewMessagePort = commandCtx.commandViewMessagePort.current;
    if ((messagePort || viewMessagePort) && commandKeys.has(event.key)) {
      const { key, ctrlKey, altKey, metaKey, shiftKey } = event;
      const keydownEvent: ExtensionAPI.UI.SearchPanel.KeydownEvent = {
        key,
        altKey,
        ctrlKey,
        metaKey,
        shiftKey,
      };
      viewMessagePort?.sendMessage('extension:keydown-event', keydownEvent);
      messagePort.event.sendMessage('extension:keydown-event', keydownEvent);
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
      case 'Space': {
        const hasAlias = useCommandStore
          .getState()
          .commandAliases.has(target.value.trimEnd());
        if (hasAlias) {
          uiListStore.listController.current?.selectItem();
          event.preventDefault();
        }
        break;
      }
      default:
        uiListStore.listControllerKeyBind(event.nativeEvent);
    }
  }
  function onInputValueChange(value: string) {
    moveArgumentContainer(value);

    const messagePort = commandCtx.runnerMessagePort.current;
    const viewMessagePort = commandCtx.commandViewMessagePort.current;
    if (messagePort || viewMessagePort) {
      viewMessagePort?.sendMessage('extension:query-change', value);
      messagePort?.event.sendMessage('extension:query-change', value);
    }

    uiListStore.setState('search', value);
  }

  useEffect(() => {
    const messagePort = commandCtx.runnerMessagePort.current;
    const offListener = messagePort.event.on(
      'extension:query-clear-value',
      () => {
        uiListStore.setState('search', '');
      },
    );
    const offUpdatePlaceholderListener = messagePort.event.on(
      'extension:query-update-placeholder',
      (placeholder) => {
        if (!inputRef.current) return;
        inputRef.current.placeholder = placeholder;
      },
    );

    return () => {
      offListener();
      offUpdatePlaceholderListener();
    };
  }, [uiListStore, commandCtx.runnerMessagePort]);

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="flex h-14 items-center px-4 focus:outline-none"
      tabIndex={-1}
      onKeyDown={onKeyDown}
    >
      <CommandInputIcon onNavigateBack={navigateBack} />
      <div className="relative h-full flex-grow">
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
        className="pointer-events-none absolute -z-50 bg-transparent text-transparent"
        ref={spanRef}
      ></span>
    </div>
  );
}

export default CommandInput;
