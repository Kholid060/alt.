import { Events } from './events';

export declare namespace UI {
  interface ToastOptions {
    title: string;
    timeout?: number;
    description?: string;
    type?: 'loading' | 'error' | 'success';
  }
  interface Toast extends ToastOptions {
    hide(): void;
    show(options?: Partial<ToastOptions>): void;
  }

  interface Static {
    // @ext-api-value
    createToast(options: ToastOptions): Toast;

    searchPanel: SearchPanel.Static;
  }
}

export declare namespace UI.SearchPanel {
  interface KeydownEvent {
    key: string;
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
  }

  interface Static {
    onChanged: Events.Event<(value: string) => void>;
    onKeydown: Events.Event<(event: KeydownEvent) => void>;

    // @ext-api-value
    updatePlaceholder(placeholder: string): void;

    // @ext-api-value
    clearValue(): void;
  }
}
