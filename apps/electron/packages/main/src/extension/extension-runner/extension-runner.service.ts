import {
  ExtensionBrowserTabContext,
  ExtensionCommandExecutePayload,
  ExtensionCommandExecutePayloadWithData,
  ExtensionCommandJSONViewData,
} from '#packages/common/interface/extension.interface';
import { CommandLaunchBy, ExtensionAPI } from '@altdot/extension';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ExtensionConfigService } from '../extension-config/extension-config.service';
import { BrowserExtensionService } from '/@/browser-extension/browser-extension.service';
import { ExtensionLoaderService } from '/@/extension-loader/extension-loader.service';
import {
  CommandJSON,
  CommandJSONValidation,
} from '@altdot/extension/dist/validation/command-json.validation';
import type { Cache } from 'cache-manager';
import { DBService } from '/@/db/db.service';
import { BrowserWindowService } from '/@/browser-window/browser-window.service';
import { extensionErrors } from '/@/db/schema/extension.schema';
import { ClipboardService } from '/@/clipboard/clipboard.service';
import { MessageChannelMain, shell } from 'electron';
import { parseJSON } from '@altdot/shared';
import { debugLog } from '#packages/common/utils/helper';
import { getExtensionPlatform } from '/@/common/utils/helper';
import ExtensionRunnerCommandAction from './runner/ExtensionRunnerCommandAction';
import ExtensionRunnerBase from './runner/ExtensionRunnerBase';
import { ExtensionRunnerExecutionService } from './extension-runner-execution.service';
import ExtensionRunnerCommandScript from './runner/ExtensionRunnerCommandScript';
import ExtensionRunnerCommandView from './runner/ExtensionRunnerCommandView';

@Injectable()
export class ExtensionRunnerService implements OnModuleInit {
  private runningCommands: Map<string, ExtensionRunnerBase> = new Map();
  private executionResolvers = new Map<
    string,
    PromiseWithResolvers<ExtensionAPI.Command.LaunchResult>
  >();

  constructor(
    private dbService: DBService,
    private clipboard: ClipboardService,
    private browserWindow: BrowserWindowService,
    private extensionLoader: ExtensionLoaderService,
    private extensionConfig: ExtensionConfigService,
    private browserExtension: BrowserExtensionService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private executionService: ExtensionRunnerExecutionService,
  ) {}

  onModuleInit() {
    this.executionService.runnerEventEmitter.on(
      'finish',
      async ({ payload, data, runnerId }) => {
        // eslint-disable-next-line drizzle/enforce-delete-with-where
        this.runningCommands.delete(runnerId);

        if (payload.command.type === 'action') {
          const commandWindow = await this.browserWindow.get('command', {
            noThrow: true,
            autoCreate: false,
          });
          if (commandWindow) {
            commandWindow.sendMessage(
              'command-window:close-message-port',
              runnerId,
            );
          }
        } else if (
          payload.command.type === 'script' &&
          payload.command.metadata?.scriptHasView &&
          payload.launchContext.launchBy !== CommandLaunchBy.WORKFLOW
        ) {
          const commandJSON = CommandJSONValidation.safeParse(
            parseJSON(data as string, null),
          );
          if (commandJSON.success) {
            this.handleCommandJSON(commandJSON.data, {
              title: payload.command.title,
              commandId: payload.commandId,
              extensionId: payload.extensionId,
              subtitle: payload.command.extension.title,
              icon: payload.command.icon || payload.command.extension.icon,
            });
          } else {
            debugLog(JSON.stringify(commandJSON.error, null, 2));
          }
        }
      },
    );
    this.executionService.runnerEventEmitter.on(
      'error',
      async ({ errorMessage, payload, runnerId }) => {
        // eslint-disable-next-line drizzle/enforce-delete-with-where
        this.runningCommands.delete(runnerId);

        await this.dbService.db.insert(extensionErrors).values({
          message: errorMessage,
          title: payload.command.title,
          extensionId: payload.extensionId,
        });

        const commandWindow = await this.browserWindow.get('command', {
          noThrow: true,
          autoCreate: false,
        });
        if (commandWindow) {
          commandWindow.sendMessage(
            'command-window:close-message-port',
            runnerId,
          );
        }
      },
    );
  }

  private async getBrowserCtx(): Promise<
    ExtensionBrowserTabContext | undefined
  > {
    return this.cacheManager.wrap(
      'extension:browser-ctx',
      async () => {
        const browser = await this.browserExtension.getFocused();
        if (!browser) return undefined;

        return {
          url: browser.tab.url,
          tabId: browser.tab.id,
          browserId: browser.id,
          title: browser.tab.title,
        };
      },
      2500,
    );
  }

  private async handleCommandJSON(
    data: CommandJSON,
    detail: ExtensionCommandJSONViewData['detail'],
  ) {
    if (data.action) {
      switch (data.action.type) {
        case 'copy':
          this.clipboard.write(
            'text',
            typeof data.action.content === 'string'
              ? data.action.content
              : JSON.stringify(data.action.content),
          );
          break;
        case 'open-url':
          shell.openExternal(data.action.url);
          break;
        case 'paste':
          await this.clipboard.paste(data.action.content);
          break;
        case 'show-in-folder':
          shell.openPath(data.action.path);
          break;
      }
    } else if (data.view) {
      const commandWindow = await this.browserWindow.get('command');
      commandWindow.sendMessage('command-window:open-json-view', {
        detail,
        view: data.view,
      });
    }
  }

  getRunningCommands() {
    return [...this.runningCommands.values()];
  }

  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    options?: { waitUntilFinished?: boolean },
  ): Promise<string | ExtensionAPI.Command.LaunchResult | null>;
  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    options?: { waitUntilFinished?: false },
  ): Promise<string | null>;
  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    options?: { waitUntilFinished?: true },
  ): Promise<ExtensionAPI.Command.LaunchResult | null>;
  async executeCommand(
    executePayload: ExtensionCommandExecutePayload,
    options?: { waitUntilFinished?: boolean },
  ): Promise<unknown> {
    const payload: ExtensionCommandExecutePayload = executePayload;
    const { commandId, extensionId } = payload;

    const command = await this.dbService.db.query.extensionCommands.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.name, commandId),
          operators.eq(fields.extensionId, extensionId),
        );
      },
      with: {
        extension: {
          columns: {
            id: true,
            icon: true,
            title: true,
            isLocal: true,
            isError: true,
            isDisabled: true,
            errorMessage: true,
          },
        },
      },
    });
    if (!command) throw new Error("Coudln't find command");
    if (command.extension.isDisabled) {
      throw new Error(
        `The extension of the "${command.title}" command is disabled`,
      );
    }
    if (command.isDisabled) throw new Error('This command is disabled');

    if (!payload.browserCtx) {
      payload.browserCtx = await this.getBrowserCtx();
    }

    const commandFilePath =
      command.path ||
      (await this.extensionLoader.getPath(extensionId, 'base', commandId));
    if (!commandFilePath) throw new Error("Coudln't find command file");

    const commandConfig = await this.extensionConfig.isInputted(
      extensionId,
      commandId,
    );
    if (typeof commandConfig === 'string') {
      const windowCommand = await this.browserWindow.get('command');
      await windowCommand.sendMessage('command-window:input-config', {
        commandId,
        extensionId,
        type: commandConfig,
        executeCommandPayload: payload,
      });

      throw new Error("Config hasn't been inputted");
    }

    const executeCommandPayload: ExtensionCommandExecutePayloadWithData = {
      ...payload,
      command,
      commandFilePath,
      platform: getExtensionPlatform(),
    };

    switch (command.type) {
      case 'script': {
        const runner = new ExtensionRunnerCommandScript(
          executeCommandPayload,
          this.executionService.runnerEventEmitter,
        );
        this.runningCommands.set(runner.id, runner);

        return runner.run({ waitUntilFinished: options?.waitUntilFinished });
      }
      case 'action': {
        const mainChannel = new MessageChannelMain();
        const rendererChannel = new MessageChannelMain();

        const runner = new ExtensionRunnerCommandAction(
          executeCommandPayload,
          this.executionService.runnerEventEmitter,
          {
            main: mainChannel.port1,
            renderer: rendererChannel.port1,
          },
        );
        this.executionService.addMessagePort(mainChannel.port2, runner.id);
        this.runningCommands.set(runner.id, runner);

        const commandWindow = await this.browserWindow.get('command', {
          noThrow: true,
          autoCreate: false,
        });
        if (commandWindow) {
          commandWindow.postMessage(
            'command-window:extension-port',
            runner.id,
            [rendererChannel.port2],
          );
        }

        return runner.run({ waitUntilFinished: options?.waitUntilFinished });
      }
      case 'view': {
        const windowCommand = await this.browserWindow.get('command');
        const runner = new ExtensionRunnerCommandView(
          windowCommand,
          executeCommandPayload,
          this.executionService.runnerEventEmitter,
        );
        this.runningCommands.set(runner.id, runner);

        return runner.run();
      }
      default:
        throw new Error(
          `Command with "${command.type}" type doesn't have handler`,
        );
    }
  }

  stopCommandExecution(runnerId: string) {
    const runningCommand = this.runningCommands.get(runnerId);
    if (runningCommand) runningCommand.stop();

    // eslint-disable-next-line drizzle/enforce-delete-with-where
    this.runningCommands.delete(runnerId);
  }
}
