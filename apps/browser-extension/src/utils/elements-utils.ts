export function isInput(el: Element): el is HTMLInputElement {
  return el.tagName === 'INPUT';
}

export function isTextarea(el: Element): el is HTMLTextAreaElement {
  return el.tagName === 'TEXTAREA';
}

export function isInputOrTextarea(
  el: Element,
): el is HTMLInputElement | HTMLTextAreaElement {
  return isInput(el) || isTextarea(el);
}

export function isContentEditable(el: Element): el is HTMLElement {
  return el instanceof HTMLElement && el.isContentEditable;
}

export function submitFormInput(el: HTMLInputElement) {
  if (!el.form) return false;

  const dispatched = el.dispatchEvent(
    new SubmitEvent('submit', {
      submitter: el,
      bubbles: true,
      cancelable: true,
    }),
  );
  if (!dispatched) return false;

  el.form.submit();

  return true;
}

export function isElementVisible(element: Element) {
  const { height, width } = element.getBoundingClientRect();
  const { display, visibility } = window.getComputedStyle(element);

  return (
    height > 0 && width > 0 && display !== 'none' && visibility !== 'hidden'
  );
}
