import { Inject, Injectable } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import {
  CustomError,
  ExtensionError,
} from '#packages/common/errors/custom-errors';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getExtensionConfigDefaultValue } from '/@/common/utils/helper';
import { ExtensionNeedConfigInput } from '#packages/common/interface/extension.interface';
import { safeStorage } from 'electron';
import { DBService } from '/@/db/db.service';
import {
  SelectExtensionConfig,
  extensionConfigs,
} from '/@/db/schema/extension.schema';
import { parseJSON } from '@altdot/shared';
import { eq } from 'drizzle-orm';
import {
  ExtensionConfigGetPayload,
  ExtensionConfigInsertPayload,
  ExtensionConfigModel,
  ExtensionConfigUpdatePayload,
  ExtensionConfigValue,
  ExtensionConfigWithSchemaModel,
} from './extension-config.interface';

function separateConfigValue(value: ExtensionConfigValue) {
  const finalValue: Record<string, unknown> = {};
  const encryptedValue: Record<string, unknown> = {};

  let hasEncryptedValue = false;
  for (const key in value) {
    const item = value[key];
    if (item.type === 'input:password') {
      hasEncryptedValue = true;
      encryptedValue[key] = item.value;
    } else {
      finalValue[key] = item.value;
    }
  }

  return {
    value: finalValue,
    encryptedValue: hasEncryptedValue
      ? safeStorage.encryptString(JSON.stringify(encryptedValue))
      : null,
  };
}
function getConfigValue(
  config: Pick<SelectExtensionConfig, 'value' | 'encryptedValue'>,
) {
  return {
    ...config.value,
    ...parseJSON<object, object>(
      config.encryptedValue
        ? safeStorage.decryptString(config.encryptedValue)
        : '{}',
      {},
    ),
  };
}

@Injectable()
export class ExtensionConfigService {
  constructor(
    private dbService: DBService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  exists(configId: string) {
    return this.dbService.db.query.extensionConfigs
      .findFirst({
        columns: { id: true },
        where(fields, operators) {
          return operators.eq(fields.configId, configId);
        },
      })
      .then((value) => Boolean(value));
  }

  async isInputted(
    extensionId: string,
    commandId?: string,
  ): Promise<ExtensionNeedConfigInput> {
    const configId = commandId ? `${extensionId}:${commandId}` : extensionId;
    return this.cacheManager.wrap(`config-inputted:${configId}`, async () => {
      const extension = await this.dbService.db.query.extensions.findFirst({
        columns: {
          id: true,
          config: true,
          isError: true,
        },
        where(fields, operators) {
          return operators.eq(fields.id, extensionId);
        },
        with: { commands: { columns: { name: true, config: true } } },
      });
      if (!extension || extension.isError) {
        throw new CustomError('Extension not found');
      }

      const extensionConfig = extension.config
        ? getExtensionConfigDefaultValue(extension.config)
        : null;
      if (extensionConfig?.requireInput) {
        const extensionConfigExists = await this.exists(extension.id);
        if (!extensionConfigExists) {
          return 'extension';
        }
      } else if (!commandId) {
        return false;
      }

      const command = extension.commands.find(
        (command) => command.name === commandId,
      );
      if (!command) throw new ExtensionError('Command not found');

      const commandConfig = getExtensionConfigDefaultValue(
        command.config ?? [],
      );
      if (commandConfig.requireInput) {
        const commandConfigExists = await this.exists(configId);
        if (!commandConfigExists) {
          return 'command';
        }
      }

      return false;
    });
  }

  async insertConfig({
    value,
    configId,
    extensionId,
  }: ExtensionConfigInsertPayload) {
    const result = await this.dbService.db
      .insert(extensionConfigs)
      .values({
        configId,
        extensionId,
        ...separateConfigValue(value),
      })
      .returning();

    return result;
  }

  async getConfigWithSchema({
    configId,
    commandId,
    extensionId,
  }: ExtensionConfigGetPayload): Promise<ExtensionConfigWithSchemaModel | null> {
    if (commandId) {
      const command = await this.dbService.db.query.extensionCommands.findFirst(
        {
          where(fields, operators) {
            return operators.and(
              operators.eq(fields.extensionId, extensionId),
              operators.eq(fields.name, commandId),
            );
          },
          with: { extension: {} },
        },
      );
      if (!command || !command.config || !command.extension) return null;

      const value = (await this.getConfigs(configId)) ?? {};
      return {
        value,
        configId,
        extensionId,
        config: command.config,
        commandTitle: command.title,
        commandIcon: command.icon ?? '',
        extensionIcon: command.extension.icon,
        extensionTitle: command.extension.title,
      };
    }

    const extension = await this.dbService.db.query.extensions.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
    });
    if (!extension || !extension.config) return null;

    const value = (await this.getConfigs(configId)) ?? {};
    return {
      value,
      configId,
      extensionId,
      commandIcon: '',
      commandTitle: '',
      config: extension.config,
      extensionIcon: extension.icon,
      extensionTitle: extension.title,
    };
  }

  async getConfigs(configIds: string): Promise<ExtensionConfigModel | null>;
  async getConfigs(configIds: string[]): Promise<ExtensionConfigModel[]>;
  async getConfigs(configIds: string | string[]) {
    const mapConfigValue = (
      config: SelectExtensionConfig,
    ): ExtensionConfigModel => ({
      configId: config.configId,
      extensionId: config.extensionId,
      value: getConfigValue(config),
    });

    if (Array.isArray(configIds)) {
      const configs = await this.dbService.db.query.extensionConfigs.findMany({
        where(fields, operators) {
          return operators.inArray(fields.configId, configIds);
        },
      });
      return configs.map(mapConfigValue);
    }

    const config = await this.dbService.db.query.extensionConfigs.findFirst({
      where(fields, operators) {
        return operators.eq(fields.configId, configIds);
      },
    });
    return config ? mapConfigValue(config) : null;
  }

  async updateConfig(
    configId: string,
    { value }: ExtensionConfigUpdatePayload,
  ) {
    return this.dbService.db
      .update(extensionConfigs)
      .set({
        ...(value && separateConfigValue(value)),
      })
      .where(eq(extensionConfigs.configId, configId))
      .returning();
  }
}
