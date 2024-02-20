import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { imageSize } from 'image-size';
import { build, Options } from 'tsup';
import { fromZodError } from 'zod-validation-error';
import { ExtensionManifestSchema, ExtensionManifest } from '../../src';
import { BuildError, logger } from './utils/logger';

const EXT_ROOT_DIR = process.cwd();
const EXT_SRC_DIR = path.join(EXT_ROOT_DIR, 'src');
const EXT_ICON_DIR = path.join(EXT_ROOT_DIR, 'icon');

const SUPPORTED_ICON_SIZE = 256;
const SUPPORTED_ICON_TYPE = ['.png', '.jpg'];

const seenIcon = new Set<string>();

async function validateIcon(iconName: string) {
  if (seenIcon.has(iconName) || iconName.startsWith('icon:')) return;

  const iconExtName = path.extname(iconName);
  if (!SUPPORTED_ICON_TYPE.includes(iconExtName)) {
    throw new BuildError(`Unsupported "${iconName}" icon type, the icon must be PNG or JPEG.`);
  }

  const iconPath = path.join(EXT_ICON_DIR, iconName);
  if (!fs.existsSync(iconPath)) {
    throw new BuildError(`Can't find "${iconName}" icon file`);
  }

  const iconSize = imageSize(iconPath);
  if (iconSize.height !== SUPPORTED_ICON_SIZE || iconSize.width !== SUPPORTED_ICON_SIZE) {
    throw new BuildError(`"${iconName}" size must be 256x256`);
  }

  seenIcon.add(iconName);
}

async function getExtensionManifest() {
  const packageJSONDir = path.join(EXT_ROOT_DIR, 'package.json');
  if (!fs.existsSync(packageJSONDir)) {
    throw logger.error(`Can't find "${chalk.bold('package.json')}" file`);
  }

  const packageJSON = await fs.readJSON(packageJSONDir);

  const manifest = await ExtensionManifestSchema.safeParseAsync(packageJSON);
  if (!manifest.success) {
    throw logger.error(fromZodError(manifest.error).toString());
  }

  const extManifest = manifest.data;

  await validateIcon(extManifest.icon);
  await Promise.all(extManifest.commands.map((command) => {
    if (!command.icon) return Promise.resolve();

    return validateIcon(command.icon);
  }));

  return extManifest;
}

async function buildCommands(manifest: ExtensionManifest) {
  const seenCommand = new Set<string>();
  const entry: Options['entry'] = {};
  for (const command of manifest.commands) {
    if (seenCommand.has(command.name)) {
      throw new BuildError(`The "${chalk.bold(command.name)}" command has duplicate`);
    }
    seenCommand.add(command.name);
    entry[command.name] = path.join(EXT_SRC_DIR, `${command.name}`);
  }

  const config: Options = {
    entry,
    format: 'esm',
    publicDir: EXT_ICON_DIR,
    external: ['@repo/command-api'],
    onSuccess: () => {
      return fs.writeJSON(path.join(EXT_ROOT_DIR, 'dist', 'manifest.json'), manifest);
    },
  };
  await build(config);
}

async function buildExtension() {
  try {
    const extensionManifest = await getExtensionManifest();
    await buildCommands(extensionManifest);
  } catch (error) {
    if (error instanceof BuildError) {
      logger.error(error.message);
      return;
    }

    console.error(error);
  }
}

export default buildExtension;