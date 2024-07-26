export function getFileExt(path: string) {
  return path.split('.').pop()!;
}

export function sleep(ms = 500) {
  return new Promise((r) => setTimeout(r, ms));
}
