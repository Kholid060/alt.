import * as UiList from '@altdot/ui/dist/components/ui/list';
import * as UiInput from '@altdot/ui/dist/components/ui/input';
import * as UiIcons from '@altdot/ui/dist/components/ui/icons';
import * as UiImage from '@altdot/ui/dist/components/ui/image';
import * as UiSelect from '@altdot/ui/dist/components/ui/select';
import * as UiSwitch from '@altdot/ui/dist/components/ui/switch';
import * as UiTextarea from '@altdot/ui/dist/components/ui/textarea';
import * as UiSkeleton from '@altdot/ui/dist/components/ui/skeleton';

function injector(components: Record<string, unknown>) {
  for (const key in components) {
    Object.defineProperty(window, `$${key}`, {
      writable: false,
      enumerable: false,
      configurable: false,
      value: components[key],
    });
  }
}

function injectComponents() {
  injector(UiList);
  injector(UiInput);
  injector(UiImage);
  injector(UiIcons);
  injector(UiSelect);
  injector(UiSwitch);
  injector(UiTextarea);
  injector(UiSkeleton);
}

export default injectComponents;
