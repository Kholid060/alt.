import chalk from 'chalk';
import path from 'path/posix';
import fs from 'fs-extra';
import semverValid from 'semver/functions/valid';
import semverClean from 'semver/functions/clean';
import { PackageJson as PackageJsonType } from 'type-fest';
import { BuildError, logger } from './logger';
import {
  ExtensionManifest,
  ExtensionManifestSchema,
} from '../../extension-manifest';
import { fromZodError } from 'zod-validation-error';
import imageSize from 'image-size';
import { globby } from 'globby';
import { z } from 'zod';
import { bundleRequire } from 'bundle-require';
import { errorMap } from 'zod-validation-error';

export type PackageJson = PackageJsonType & ExtensionManifest;

type ExtPathName = 'dist-manifest.json' | 'package.json' | 'icon' | 'src';

export const EXT_API_PKG_NAME = '@altdot/extension';

const SUPPORTED_ICON_SIZE = 256;
const SUPPORTED_ICON_TYPE = ['.png'];
const EXT_COMMAND_FILE_EXTENSION = '.{js,jsx,ts,tsx}';
const EXT_COMMAND_ACTION_FILE_EXTENSION = '.{js,ts}';

z.setErrorMap(errorMap);
class ManifestUtils {
  private seenExtIcon = new Set<string>();

  basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath.split('\\').join(path.sep);
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

  private async resolveExtensionManifest() {
    let [manifestFilePath] = await globby('./manifest.{ts,js,json}');
    if (!manifestFilePath) {
      throw new BuildError("Couldn't find Manifest file");
    }

    manifestFilePath = path.join(this.basePath, manifestFilePath);
    let manifestObject: unknown | null = null;

    const isJSON = path.extname(manifestFilePath) === '.json';
    if (isJSON) {
      manifestObject = await fs.readJSON(manifestFilePath);
    } else {
      const script = await bundleRequire({
        filepath: manifestFilePath,
      });
      manifestObject = script.mod.default ?? null;
    }

    return { path: manifestFilePath, data: manifestObject };
  }

  async getExtensionManifest(): Promise<{
    path: string;
    data: ExtensionManifest;
  }> {
    const manifestFile = await this.resolveExtensionManifest();
    const manifest = await ExtensionManifestSchema.merge(
      z.object({
        $apiVersion: z.string().optional(),
      }),
    ).safeParseAsync(manifestFile.data);
    if (!manifest.success) {
      throw logger.error(
        fromZodError(manifest.error, {
          prefixSeparator: ': ',
          prefix: chalk.red('manifest validation'),
        }).toString(),
      );
    }
    if (!semverValid(manifest.data.version)) {
      throw logger.error(
        `"${manifest.data.version}" is invalid version. See https://semver.org/`,
      );
    }

    manifest.data.$apiVersion = (await this.getPackageJSON()).$apiVersion;

    this.seenExtIcon.clear();

    await this.validateIcon(manifest.data.icon);
    await Promise.all(
      manifest.data.commands.map((command) => {
        if (!command.icon) return Promise.resolve();

        return this.validateIcon(command.icon);
      }),
    );

    return {
      path: manifestFile.path,
      data: manifest.data as ExtensionManifest,
    };
  }

  writeManifestFile(manifest: ExtensionManifest) {
    return fs.writeJSON(this.getExtPath('dist-manifest.json'), manifest);
  }

  async getExtensionCommands(manifest: ExtensionManifest) {
    const seenCommand = new Set<string>();

    const scripts: Record<string, string> = {};
    const commands: Record<string, string> = {};

    await Promise.all(
      manifest.commands.map(async (command) => {
        if (seenCommand.has(command.name)) {
          throw new BuildError(`"${chalk.bold(command.name)}" has duplicate`);
        }

        // validate command arguments
        const seenArg = new Set<string>();
        command.arguments?.forEach((arg) => {
          if (seenArg.has(arg.name)) {
            throw new BuildError(
              `"${chalk.bold(arg.name)}" argument in "${command.title}" command has duplicate`,
            );
          }
          seenArg.add(arg.name);
        });

        const [commandFilePath] = await globby(
          command.type === 'script'
            ? path.join(this.getExtPath('src'), command.name)
            : [
                path.join(
                  this.getExtPath('src'),
                  `${command.name}${EXT_COMMAND_FILE_EXTENSION}`,
                ),
                path.join(
                  this.getExtPath('src'),
                  `${command.name}/index${EXT_COMMAND_FILE_EXTENSION}`,
                ),
              ],
        );
        if (!commandFilePath) {
          throw new BuildError(
            `Couldn't find "${chalk.bold(command.name)}" command file`,
          );
        }

        if (command.type === 'script') {
          scripts[command.name] = commandFilePath;
        } else {
          commands[command.name] = commandFilePath;

          if (command.type === 'view') {
            const commandFileName = path.basename(
              commandFilePath,
              path.extname(commandFilePath),
            );
            const commandDirName = path.dirname(commandFilePath);

            let viewActionPath: string | null = null;

            if (commandFileName === 'index') {
              const lastDirName = commandDirName.split('/').pop();
              viewActionPath = path.join(
                commandDirName,
                `${lastDirName}.action${EXT_COMMAND_ACTION_FILE_EXTENSION}`,
              );
            } else {
              viewActionPath = path.join(
                commandDirName,
                `${commandFileName}.action${EXT_COMMAND_ACTION_FILE_EXTENSION}`,
              );
            }

            const [commandViewAction] = await globby(viewActionPath);
            if (commandViewAction) {
              commands[`${command.name}.action`] = commandViewAction;
            }
          }
        }
      }),
    );

    return { commands, scripts };
  }

  private async validateIcon(iconName: string) {
    if (this.seenExtIcon.has(iconName) || iconName.startsWith('icon:')) return;

    const iconPath = path.join(this.getExtPath('icon'), iconName + '.png');
    if (!fs.existsSync(iconPath)) {
      throw new BuildError(
        `Couldn't find "${iconName}" icon file. Put the icon file inside public/icon/icon-name.png directory`,
      );
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
