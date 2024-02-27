export function extPathParser(path: string) {
  const [_, ext, extId, commandId] = path.split('/');

  return {
    extId,
    commandId,
    isValid: Boolean(ext && extId && commandId),
  }
}
