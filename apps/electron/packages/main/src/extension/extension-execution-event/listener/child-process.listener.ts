import { Injectable } from '@nestjs/common';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { exec, ExecOptions } from 'child_process';
import { ExtensionAPI } from '@altdot/extension';
import { ExtensionLoaderService } from '/@/extension-loader/extension-loader.service';

@Injectable()
export class ExtensionChildProcessApiListener {
  constructor(private extensionLoader: ExtensionLoaderService) {}

  @OnExtensionAPI('childProcess.exec')
  async updateCommand({
    args: [command, args, options = {}],
    context: { extensionId },
  }: ExtensionApiEvent<'childProcess.exec'>) {
    const cwd = await this.extensionLoader.getPath(extensionId, 'base');
    return new Promise<ExtensionAPI.ChildProcess.ExecResult>(
      (resolve, reject) => {
        exec(
          `${command} ${args.join(' ')}`,
          { ...options, cwd } as ExecOptions,
          (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
          },
        );
      },
    );
  }
}
