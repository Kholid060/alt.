import { BrowserSelectFileOptions } from '@repo/shared';

export function selectFile(
  element: HTMLInputElement,
  files: BrowserSelectFileOptions[],
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
}
