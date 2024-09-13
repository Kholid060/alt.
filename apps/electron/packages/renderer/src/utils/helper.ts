import { CUSTOM_SCHEME } from '#common/utils/constant/constant';
import { IPCEventError } from '#packages/common/interface/ipc-events.interface';
import { isObject } from '@altdot/shared';

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

export function getExtIconURL(icon: string, extensionId: string) {
  if (icon.startsWith('icon:')) return icon;

  return `${CUSTOM_SCHEME.extension}://${extensionId}/icon/${icon}`;
}

export function isIPCEventError(result: unknown): result is IPCEventError {
  return Boolean(result) && isObject(result) && '$isError' in result;
}

export function formatDuration(duration: number) {
  if (duration < 5000) return 'Less than 5 seconds';
  if (duration < 60_000) return `${Math.round(duration / 1000)} seconds`;

  return `${Math.round(duration / 1000 / 60)} minutes`;
}
