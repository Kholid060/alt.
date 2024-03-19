import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { ExtensionCommand } from '@repo/extension-core';

export function extPathParser(path: string) {
  const [_, ext, extId, commandId] = path.split('/');

  return {
    extId,
    commandId,
    isValid: Boolean(ext && extId && commandId),
  };
}

// https://github.com/wojtekmaj/merge-refs
export function mergeRefs<T>(
  ...inputRefs: (React.Ref<T> | undefined)[]
): React.Ref<T> | React.RefCallback<T> {
  const filteredInputRefs = inputRefs.filter(Boolean);

  if (filteredInputRefs.length <= 1) {
    const firstRef = filteredInputRefs[0];

    return firstRef || null;
  }

  return function mergedRefs(ref) {
    filteredInputRefs.forEach((inputRef) => {
      if (typeof inputRef === 'function') {
        inputRef(ref);
      } else if (inputRef) {
        (inputRef as React.MutableRefObject<T | null>).current = ref;
      }
    });
  };
}

export function getCommandIcon(command: ExtensionCommand, extensionId: string) {
  if (!command.icon) return undefined;
  if (command.icon.startsWith('icon:')) return command.icon;

  return `${CUSTOM_SCHEME.extension}://${extensionId}/icon/${command.icon}`;
}
