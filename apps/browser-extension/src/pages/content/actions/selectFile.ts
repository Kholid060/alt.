import { ExtensionAPI } from '@altdot/extension';
import { BrowserSelectFileData, sleep } from '@altdot/shared';

const actions: Record<
  Required<ExtensionAPI.Browser.Tabs.SelectFileOptions>['action'],
  (
    element: Element,
    dataTransfer: DataTransfer,
    view: Window,
  ) => void | Promise<void>
> = {
  select(element, dataTransfer, view) {
    if (!(element instanceof HTMLInputElement) || element.type !== 'file') {
      throw new Error(
        'Invalid element. The element must  be "<input type="file">"',
      );
    }

    element.files = dataTransfer.files;

    element.dispatchEvent(
      new InputEvent('input', {
        view,
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
    element.dispatchEvent(
      new Event('change', {
        bubbles: true,
        composed: true,
        cancelable: true,
      }),
    );
  },
  async 'drag-drop'(element, dataTransfer, view) {
    const dragEventOptions: DragEventInit = {
      view,
      dataTransfer,
      bubbles: true,
      composed: true,
      cancelable: true,
    };
    element.dispatchEvent(new DragEvent('drag', dragEventOptions));
    await sleep(50);
    element.dispatchEvent(new DragEvent('dragenter', dragEventOptions));
    await sleep(50);
    element.dispatchEvent(new DragEvent('dragover', dragEventOptions));
    await sleep(50);
    element.dispatchEvent(new DragEvent('drop', dragEventOptions));
  },
};

export async function selectFile(
  element: Element,
  files: BrowserSelectFileData[],
  options?: ExtensionAPI.Browser.Tabs.SelectFileOptions,
) {
  const view = element.ownerDocument.defaultView || window;
  const dataTransfer = new view.DataTransfer();

  files.forEach(({ contents, fileName, lastModified, mimeType }) => {
    const file = new view.File([contents], fileName, {
      lastModified,
      type: mimeType,
    });
    dataTransfer.items.add(file);
  });

  actions[options?.action ?? 'select'](element, dataTransfer, view);
}
