const PROGRAMS_SHORTCUT_DIR = [
  '%APPDATA%/Microsoft/Windows/Start Menu/Programs',
] as const;

function resolveDir(dir: string) {
  let isNoEnv = false;
  
  const resolveDir = dir.replaceAll(/%([^%]+)%/g, (_, match: string) => {
    if (Object.hasOwn(process.env, match)) return process.env[match]!;

    isNoEnv = true;

    return '';
  });

  return isNoEnv ? null : resolveDir;
};

export function getAllInstalledPrograms() {
  const programDataDir = 
  console.log(resolveDir(''));
}
