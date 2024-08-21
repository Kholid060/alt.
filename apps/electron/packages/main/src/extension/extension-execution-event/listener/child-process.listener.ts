import { Injectable } from '@nestjs/common';
import { ExtensionApiEvent } from '../events/extension-api.event';
import { OnExtensionAPI } from '/@/common/decorators/extension.decorator';
import { exec, ExecOptions } from 'child_process';
import { ExtensionAPI } from '@altdot/extension';
import { ExtensionLoaderService } from '/@/extension-loader/extension-loader.service';
import { appEnvSchema } from '/@/common/validation/app-env.validation';

@Injectable()
export class ExtensionChildProcessApiListener {
  constructor(private extensionLoader: ExtensionLoaderService) {}

  @OnExtensionAPI('childProcess.exec')
  async updateCommand({
    args: [command, options = {}],
    context: { extensionId },
  }: ExtensionApiEvent<'childProcess.exec'>) {
    const cwd = await this.extensionLoader.getPath(extensionId, 'base');
    const filteredEnv = Object.fromEntries(
      Object.keys(appEnvSchema.shape).map((key) => [key, '']),
    );

    return new Promise<ExtensionAPI.ChildProcess.ExecResult>(
      (resolve, reject) => {
        exec(
          command,
          {
            cwd,
            timeout: 10_000,
            ...options,
            env: { ...filteredEnv, ...(options.env ?? {}) },
          } as ExecOptions,
          (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve({ stdout, stderr });
          },
        );
      },
    );
  }
}
