import * as UiList from '@altdot/ui/dist/components/ui/list';
import * as UiForms from '@altdot/ui/dist/components/ui/form';
import * as UiInput from '@altdot/ui/dist/components/ui/input';
import * as UiIcons from '@altdot/ui/dist/components/ui/icons';
import * as UiLabel from '@altdot/ui/dist/components/ui/label';
import * as UiImage from '@altdot/ui/dist/components/ui/image';
import * as UiButton from '@altdot/ui/dist/components/ui/button';
import * as UiSelect from '@altdot/ui/dist/components/ui/select';
import * as UiSwitch from '@altdot/ui/dist/components/ui/switch';
import * as UiCheckbox from '@altdot/ui/dist/components/ui/checkbox';
import * as UiTextarea from '@altdot/ui/dist/components/ui/textarea';
import * as UiSkeleton from '@altdot/ui/dist/components/ui/skeleton';

function injector(modules: Record<string, unknown>[]) {
  for (const components of modules) {
    for (const key in components) {
      Object.defineProperty(window, `$${key}`, {
        writable: false,
        enumerable: false,
        configurable: false,
        value: components[key],
      });
    }
  }
}

function injectComponents() {
  injector([
    UiList,
    UiForms,
    UiLabel,
    UiInput,
    UiImage,
    UiIcons,
    UiButton,
    UiSelect,
    UiSwitch,
    UiCheckbox,
    UiTextarea,
    UiSkeleton,
  ]);
}

export default injectComponents;
