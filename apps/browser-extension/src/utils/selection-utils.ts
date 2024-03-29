import * as elementUtils from './elements-utils';

type MoveSelectionDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'start'
  | 'end';

function getElSelection(el: Element) {
  return el.ownerDocument.getSelection()!;
}

function moveInputElSelection(
  el: HTMLInputElement,
  dir: MoveSelectionDirection,
) {
  const isInputNumber = el.type === 'number';

  let selectionPos: number | null = null;

  switch (dir) {
    case 'down': {
      if (isInputNumber && el.stepDown) el.stepDown();
      break;
    }
    case 'up': {
      if (isInputNumber && el.stepUp) el.stepUp();
      break;
    }
    case 'left': {
      selectionPos = (el.selectionStart || 0) - 1;
      break;
    }
    case 'right': {
      selectionPos = (el.selectionStart || 0) + 1;
      break;
    }
    case 'start':
      selectionPos = 0;
      break;
    case 'end':
      selectionPos = el.value.length;
      break;
  }

  if (typeof selectionPos !== 'number') return;

  el.setSelectionRange(selectionPos, selectionPos);
}

function moveTextareaElSelection(
  el: HTMLTextAreaElement,
  dir: MoveSelectionDirection,
) {
  switch (dir) {
    case 'up':
    case 'down': {
      const selection = getElSelection(el);
      selection.modify('move', dir === 'up' ? 'backward' : 'forward', 'line');
      break;
    }
    case 'end':
    case 'start': {
      const selection = getElSelection(el);
      selection.modify(
        'move',
        dir === 'start' ? 'backward' : 'forward',
        'lineboundary',
      );
      break;
    }
    case 'left':
    case 'right': {
      const startPos = el.selectionStart ?? 0;
      const newPos = dir === 'left' ? startPos - 1 : startPos + 1;

      el.setSelectionRange(newPos, newPos);
    }
  }
}

function moveContentEditableElSelection(
  el: HTMLElement,
  dir: MoveSelectionDirection,
) {
  const selection = getElSelection(el);

  let modifyDir: 'forward' | 'backward' | undefined;
  let modifyGranularity: 'character' | 'line' | 'lineboundary' | undefined;

  switch (dir) {
    case 'up':
    case 'down': {
      modifyGranularity = 'line';
      modifyDir = dir === 'up' ? 'backward' : 'forward';
      break;
    }
    case 'left':
    case 'right': {
      if (!selection.isCollapsed) {
        selection.collapseToStart();
        return;
      }

      modifyGranularity = 'character';
      modifyDir = dir === 'left' ? 'backward' : 'forward';

      break;
    }
    case 'end':
    case 'start':
      modifyGranularity = 'lineboundary';
      modifyDir = dir === 'start' ? 'backward' : 'forward';
      break;
  }

  if (!modifyDir || !modifyGranularity) return;

  selection.modify('move', modifyDir, modifyGranularity);
}

export function deleteSelection(el: Element) {
  if (elementUtils.isContentEditable(el)) {
    el.ownerDocument.execCommand('delete', false);
  } else if (elementUtils.isInputOrTextarea(el)) {
    const { selectionStart, selectionEnd } = el;
    if (typeof selectionStart !== 'number' || typeof selectionEnd !== 'number')
      return;

    const updatedValue =
      el.value.substring(0, selectionStart) + el.value.substring(selectionEnd);
    el.value = updatedValue;

    return true;
  }

  return false;
}

export function replaceSelection(el: Element, value: string) {
  if (elementUtils.isInputOrTextarea(el)) {
    const { selectionStart, selectionEnd } = el;
    if (typeof selectionStart !== 'number' || typeof selectionEnd !== 'number')
      return false;

    const updatedValue =
      el.value.substring(0, selectionStart) +
      value +
      el.value.substring(selectionEnd);
    el.value = updatedValue;

    el.setSelectionRange(
      selectionStart + value.length,
      selectionStart + value.length,
    );

    return true;
  }

  if (elementUtils.isContentEditable(el)) {
    document.execCommand('insertText', true, value);
  }

  return false;
}

export function deleteByCursorPos(dir: 'left' | 'right', el: Element) {
  if (elementUtils.isInputOrTextarea(el)) {
    const { selectionStart, selectionEnd, value } = el;
    if (selectionStart === value.length) return false;

    if (selectionStart === selectionEnd) {
      el.setSelectionRange(
        selectionStart,
        (selectionEnd || 0) + (dir === 'left' ? -1 : 1),
      );
    }

    deleteSelection(el);

    return true;
  }

  if (elementUtils.isContentEditable(el)) {
    const selection = getElSelection(el);
    if (!selection.toString()) {
      selection.modify(
        'extend',
        dir === 'right' ? 'forward' : 'backward',
        'character',
      );
    }

    deleteSelection(el);

    return false;
  }

  return false;
}

export function selectAll(el: Element) {
  if (elementUtils.isInputOrTextarea(el)) {
    el.setSelectionRange(0, el.value.length);
    return true;
  }
  if (elementUtils.isContentEditable(el)) {
    const newRange = el.ownerDocument.createRange();
    newRange.selectNodeContents(el);

    const selection = getElSelection(el);
    selection.removeAllRanges();
    selection.addRange(newRange);

    return true;
  }

  return false;
}

export function moveSelection(direction: MoveSelectionDirection, el: Element) {
  if (elementUtils.isInput(el)) {
    moveInputElSelection(el, direction);
  } else if (elementUtils.isTextarea(el)) {
    moveTextareaElSelection(el, direction);
  } else if (elementUtils.isContentEditable(el)) {
    moveContentEditableElSelection(el, direction);
  }
}
