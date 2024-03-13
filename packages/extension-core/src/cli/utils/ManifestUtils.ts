import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import semverValid from 'semver/functions/valid';
import semverClean from 'semver/functions/clean';
import { PackageJson as PackageJsonType } from 'type-fest';
import { BuildError, logger } from './logger';
import { ExtensionManifest, ExtensionManifestSchema } from '../../client';
import { fromZodError } from 'zod-validation-error';
import imageSize from 'image-size';
import { glob } from 'glob';

export type PackageJson = PackageJsonType & ExtensionManifest;

type ExtPathName = 'dist-manifest.json' | 'package.json' | 'icon' | 'src';

export const EXT_API_PKG_NAME = '@repo/extension';

const SUPPORTED_ICON_SIZE = 256;
const SUPPORTED_ICON_TYPE = ['.png'];
const EXT_COMMAND_FILE_EXTENSION = '.{js,jsx,ts,tsx}';

class ManifestUtils {
  private seenExtIcon = new Set<string>();

  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  getExtPath(name: ExtPathName) {
    let paths: string[] = [];

    switch (name) {
      case 'package.json':
        paths = ['package.json'];
        break;
      case 'icon':
        paths = ['/public/icon'];
        break;
      case 'src':
        paths = ['/src'];
        break;
      case 'dist-manifest.json':
        paths = ['dist', 'manifest.json'];
        break;
    }

    return path.join(this.basePath, ...paths);
  }

  async getPackageJSON(): Promise<PackageJson> {
    const packageJSONDir = this.getExtPath('package.json');
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

  async getExtensionManifest(): Promise<ExtensionManifest> {
    const packageJSON = await this.getPackageJSON();

    const manifest = await ExtensionManifestSchema.safeParseAsync(packageJSON);
    if (!manifest.success) {
      throw logger.error(fromZodError(manifest.error).toString());
    }
    if (!semverValid(manifest.data.version)) {
      throw logger.error(
        `"${manifest.data.version}" is invalid version. See https://semver.org/`,
      );
    }

    this.seenExtIcon.clear();

    const extManifest = manifest.data;

    await this.validateIcon(extManifest.icon);
    await Promise.all(
      extManifest.commands.map((command) => {
        if (!command.icon) return Promise.resolve();

        return this.validateIcon(command.icon);
      }),
    );

    return extManifest;
  }

  writeManifestFile(manifest: ExtensionManifest) {
    return fs.writeJSON(this.getExtPath('dist-manifest.json'), manifest);
  }

  async getExtensionCommands(manifest: ExtensionManifest) {
    const seenCommand = new Set<string>();
    const commands: Record<string, string> = {};

    for (const command of manifest.commands) {
      const [commandFilePath] = await glob([
        path.join(
          this.getExtPath('src'),
          `${command.name}${EXT_COMMAND_FILE_EXTENSION}`,
        ),
        path.join(
          this.getExtPath('src'),
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

      commands[command.name] = path.join(
        this.getExtPath('src'),
        `${command.name}`,
      );
    }

    return commands;
  }

  private async validateIcon(iconName: string) {
    if (this.seenExtIcon.has(iconName) || iconName.startsWith('icon:')) return;

    const iconPath = path.join(this.getExtPath('icon'), iconName + '.png');
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

    this.seenExtIcon.add(iconName);
  }
}

export default ManifestUtils;
