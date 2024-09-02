import { Injectable } from '@nestjs/common';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { InstalledAppsService } from '/@/installed-apps/installed-apps.service';
import { LoggerService } from '/@/logger/logger.service';
import path from 'path';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { CustomError } from '#packages/common/errors/custom-errors';
import { shell } from 'electron';

@Injectable()
export class ExtensionShellApiListener {
  constructor(
    private logger: LoggerService,
    private installedApps: InstalledAppsService,
  ) {}

  @OnExtensionAPI('shell.installedApps.launch')
  async launchInstalledApps({
    args: [appId],
  }: ExtensionApiEvent<'shell.installedApps.launch'>) {
    try {
      await this.installedApps.launchApp(appId);

      return true;
    } catch (error) {
      const appTarget = this.installedApps.getAppPath(appId);
      this.logger.error(
        ['installedApps.launch'],
        `Failed to launch "${path.basename(appTarget?.target || '')}" (${(error as Error).message})`,
      );

      return false;
    }
  }

  @OnExtensionAPI('shell.installedApps.showInFolder')
  async showInstalledApps({
    args: [appId],
  }: ExtensionApiEvent<'shell.installedApps.showInFolder'>) {
    const appPath = this.installedApps.getAppPath(appId);
    if (!appPath) {
      throw new CustomError(`Couldn't find installed with "${appId}" appId`);
    }

    shell.showItemInFolder(
      appPath.isUrlShortcut ? appPath.shortcutPath : appPath.target,
    );
  }

  @OnExtensionAPI('shell.showItemInFolder')
  async showItemInFolder({
    args: [itemPath],
  }: ExtensionApiEvent<'shell.showItemInFolder'>) {
    shell.showItemInFolder(itemPath);

    return Promise.resolve();
  }

  @OnExtensionAPI('shell.openURL')
  async openURL({ args: [url] }: ExtensionApiEvent<'shell.openURL'>) {
    if (!url.startsWith('http')) {
      throw new CustomError('Invalid URL');
    }

    shell.openExternal(url);

    return Promise.resolve();
  }

  @OnExtensionAPI('shell.installedApps.query')
  async queryInstalledApps({
    args: [query],
  }: ExtensionApiEvent<'shell.installedApps.query'>) {
    const apps = await this.installedApps.getApps();
    if (!query?.trim()) return apps;

    if (query.startsWith('startsWith:')) {
      return apps.filter((app) => app.name.startsWith(query));
    } else if (query.startsWith('endsWith:')) {
      return apps.filter((app) => app.name.endsWith(query));
    }

    return apps.filter((app) => app.name.includes(query));
  }
}
