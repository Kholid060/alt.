import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { imageSize } from 'image-size';
import { InlineConfig } from 'vite';
import { fromZodError } from 'zod-validation-error';
import { BuildError, logger } from './utils/logger';
import semverValid from 'semver/functions/valid';
import semverClean from 'semver/functions/clean';
import { ExtensionManifestSchema, ExtensionManifest } from '../client/manifest';
import { PackageJson as PackageJsonType } from 'type-fest';
import * as tmp from 'tmp';
import { glob } from 'glob';

tmp.setGracefulCleanup();

type PackageJson = PackageJsonType & ExtensionManifest;

const EXT_ROOT_DIR = process.cwd();
const EXT_SRC_DIR = path.join(EXT_ROOT_DIR, 'src');
const EXT_ICON_DIR = path.join(EXT_ROOT_DIR, 'icon');

const SUPPORTED_ICON_SIZE = 256;
const SUPPORTED_ICON_TYPE = ['.png'];

const EXT_API_PKG_NAME = '@repo/extension';

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

  const apiDepVersion =
    packageJSON.devDependencies?.[EXT_API_PKG_NAME] ??
    packageJSON.dependencies?.[EXT_API_PKG_NAME] ??
    '';
  packageJSON.$apiVersion = semverClean(apiDepVersion) ?? '*';

  return packageJSON;
}

async function getExtensionManifest() {
  const packageJSON = await getPackageJSON();

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

async function buildCommands(manifest: ExtensionManifest, watch = false) {
  const EXT_COMMAND_FILE_EXTENSION = '.{js,jsx,ts,tsx}';

  const cleanups: (() => void)[] = [];
  const seenCommand = new Set<string>();
  const entry: Record<string, string> = {};

  for (const command of manifest.commands) {
    const [commandFilePath] = await glob([
      path.join(EXT_SRC_DIR, `${command.name}${EXT_COMMAND_FILE_EXTENSION}`),
      path.join(
        EXT_SRC_DIR,
        `${command.name}/index${EXT_COMMAND_FILE_EXTENSION}`,
      ),
    ]);
    if (!commandFilePath) {
      throw new BuildError(
        `Can't find "${chalk.bold(command.name)}" command file`,
      );
    }

    if (seenCommand.has(command.name)) {
      throw new BuildError(
        `Couldn't resolve "${chalk.bold(command.name)}" command file`,
      );
    }

    entry[command.name] = path.join(EXT_SRC_DIR, `${command.name}`);
  }

  const DEPS_MAP: Record<string, string> = {
    react: '/@preload/react.js',
    'react-dom': '/@preload/react-dom.js',
    'react/jsx-runtime': '/@preload/react-runtime.js',
  };

  process.env.NODE_ENV = 'production';

  const { build } = await import('vite');
  const config: InlineConfig = {
    mode: process.env.MODE ?? 'production',
    define: {
      'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
    },
    build: {
      watch: watch
        ? {
            clearScreen: true,
          }
        : null,
      lib: {
        entry,
        formats: ['es'],
        name: '[name].js',
      },
      rollupOptions: {
        external: [...Object.keys(DEPS_MAP)],
        output: {
          paths: (id) => {
            return DEPS_MAP[id] || id;
          },
          manualChunks: {
            [EXT_API_PKG_NAME]: [EXT_API_PKG_NAME],
          },
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name === EXT_API_PKG_NAME) {
              return '@libs/$extension-api.js';
            }

            return `@libs/${chunkInfo.name}.js`;
          },
        },
      },
      minify: true,
    },
  };
  await build(config);

  await fs.writeJSON(
    path.join(EXT_ROOT_DIR, 'dist', 'manifest.json'),
    manifest,
  );
  await fs.copy(EXT_ICON_DIR, path.join(EXT_ROOT_DIR, 'dist', 'icon'));

  cleanups.forEach((cleanup) => cleanup());
}

async function buildExtension(watch = false) {
  try {
    const extensionManifest = await getExtensionManifest();
    await buildCommands(extensionManifest, watch);
  } catch (error) {
    if (error instanceof BuildError) {
      logger.error(error.message);
      return;
    }

    console.error(error);
  }
}

export default buildExtension;
