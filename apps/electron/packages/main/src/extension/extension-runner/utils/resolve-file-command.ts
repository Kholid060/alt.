import path from 'path';
import which from 'which';

const FILE_EXT_COMMAND_MAP: Record<string, string[]> = {
  '.sh': ['sh'],
  '.js': ['node'],
  '.mjs': ['node'],
  '.cjs': ['node'],
  '.py': ['python'],
  '.pyi': ['python'],
  '.ps1': ['powershell'],
  '.ts': ['tsx', 'ts-node'],
};

const existedCommandCache = new Map<string, string>();

export async function resolveFileCommand(filePath: string) {
  const fileExt = path.extname(filePath);
  const fileCommands = FILE_EXT_COMMAND_MAP[fileExt];
  if (!fileCommands) return null;

  let fileCommand = existedCommandCache.get(fileExt) ?? null;
  if (!fileCommand) {
    const checkCommands = await Promise.all(
      fileCommands.map((command) => which(command, { nothrow: true })),
    );
    fileCommand = checkCommands.find(Boolean) ?? null;
    if (!fileCommand) return null;

    existedCommandCache.set(fileExt, fileCommand);
  }

  return fileCommand;
}
