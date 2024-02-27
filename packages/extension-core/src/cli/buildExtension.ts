import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { imageSize } from 'image-size';
import { build, InlineConfig } from 'vite';
import { fromZodError } from 'zod-validation-error';
import { BuildError, logger } from './utils/logger';
import semverValid from 'semver/functions/valid';
import { ExtensionManifestSchema, ExtensionManifest } from '../client/manifest';
import { PackageJson as PackageJsonType } from 'type-fest';

type PackageJson = PackageJsonType & ExtensionManifest;

const EXT_ROOT_DIR = process.cwd();
const EXT_SRC_DIR = path.join(EXT_ROOT_DIR, 'src');
const EXT_ICON_DIR = path.join(EXT_ROOT_DIR, 'icon');

const SUPPORTED_ICON_SIZE = 256;
const SUPPORTED_ICON_TYPE = ['.png'];

const seenIcon = new Set<string>();

async function validateIcon(iconName: string) {
  if (seenIcon.has(iconName) || iconName.startsWith('icon:')) return;

  const iconPath = path.join(EXT_ICON_DIR, iconName + '.png');
  if (!fs.existsSync(iconPath)) {
    throw new BuildError(`Can't find "${iconName}" icon file`);
  }

  const iconExtName = path.extname(iconPath);
  if (!SUPPORTED_ICON_TYPE.includes(iconExtName)) {
    throw new BuildError(
      `Unsupported "${iconName}" icon type, the icon must be PNG`,
    );
  }

  const iconSize = imageSize(iconPath);
  if (
    iconSize.height !== SUPPORTED_ICON_SIZE ||
    iconSize.width !== SUPPORTED_ICON_SIZE
  ) {
    throw new BuildError(`"${iconName}" size must be 256x256`);
  }

  seenIcon.add(iconName);
}

async function getPackageJSON(): Promise<PackageJson> {
  const packageJSONDir = path.join(EXT_ROOT_DIR, 'package.json');
  if (!fs.existsSync(packageJSONDir)) {
    throw logger.error(`Can't find "${chalk.bold('package.json')}" file`);
  }

  const packageJSON = await fs.readJSON(packageJSONDir);

  return packageJSON;
}

async function getExtensionManifest(packageJSON: PackageJson) {
  const manifest = await ExtensionManifestSchema.safeParseAsync(packageJSON);
  if (!manifest.success) {
    throw logger.error(fromZodError(manifest.error).toString());
  }
  if (!semverValid(manifest.data.version)) {
    throw logger.error(
      `"${manifest.data.version}" is invalid version. See https://semver.org/`,
    );
  }

  const extManifest = manifest.data;

  await validateIcon(extManifest.icon);
  await Promise.all(
    extManifest.commands.map((command) => {
      if (!command.icon) return Promise.resolve();

      return validateIcon(command.icon);
    }),
  );

  return extManifest;
}

async function buildCommands(manifest: ExtensionManifest) {
  const seenCommand = new Set<string>();
  const entry: Record<string, string> = {};
  for (const command of manifest.commands) {
    if (seenCommand.has(command.name)) {
      throw new BuildError(
        `The "${chalk.bold(command.name)}" command has duplicate`,
      );
    }
    seenCommand.add(command.name);
    entry[command.name] = path.join(EXT_SRC_DIR, `${command.name}`);
  }

  const config: InlineConfig = {
    define: {
      'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
    },
    build: {
      lib: {
        entry,
        formats: ['es'],
        name: '[name].js',
      },
      rollupOptions: {
        external: ['react', 'react/jsx-runtime', '@repo/extension-core'],
        output: {
          paths: {
            react: './react.js',
            'react/jsx-runtime': './react-runtime.js',
          },
        },
      },
      minify: false,
    },
  };
  await build(config);

  await fs.writeJSON(
    path.join(EXT_ROOT_DIR, 'dist', 'manifest.json'),
    manifest,
  );
  await fs.copy(EXT_ICON_DIR, path.join(EXT_ROOT_DIR, 'dist', 'icon'));
}

async function buildExtension() {
  try {
    const packageJSON = await getPackageJSON();
    const extensionManifest = await getExtensionManifest(packageJSON);
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
