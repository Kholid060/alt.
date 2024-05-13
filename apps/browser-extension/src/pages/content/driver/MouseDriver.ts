interface MouseEventOpts extends MouseEventInit {
  x?: number;
  y?: number;
}
const getDefaultMouseOpts = ({
  x = 0,
  y = 0,
  view = window,
  ...rest
}: MouseEventOpts = {}) => {
  const { scrollX, scrollY } = view || window;

  return {
    x,
    y,
    view,
    clientX: x,
    clientY: y,
    screenX: x,
    screenY: y,
    bubbles: true,
    cancelable: true,
    pageX: x + scrollX,
    pageY: x + scrollY,
    layerX: x + scrollX,
    layerY: x + scrollY,
    ...rest,
  };
};

export interface MouseDriverOpts
  extends Pick<MouseEventInit, 'bubbles' | 'cancelable'> {}

class MouseDriver {
  static down(element: Element, options?: MouseDriverOpts) {
    const opts = getDefaultMouseOpts(options);
    const mouseDownEvent = new MouseEvent('mousedown', opts);
    element.dispatchEvent(mouseDownEvent);
  }

  static up(element: Element, options?: MouseDriverOpts) {
    const opts = getDefaultMouseOpts(options);
    const mouseUpEvent = new MouseEvent('mouseup', opts);
    element.dispatchEvent(mouseUpEvent);
  }

  static click(element: Element, options?: MouseDriverOpts) {
    this.down(element, options);
    this.up(element, options);

    const opts = getDefaultMouseOpts(options);
    const mouseUpEvent = new PointerEvent('click', opts);
    element.dispatchEvent(mouseUpEvent);
  }
}

export default MouseDriver;
