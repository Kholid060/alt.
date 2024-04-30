import { and, eq, notInArray } from 'drizzle-orm';
import type {
  NewExtension,
  NewExtensionCommand,
  NewExtensionConfig,
  SelectExtensionStorage,
} from '/@/db/schema/extension.schema';
import {
  extensions,
  commands as commandsSchema,
  commands,
  configs,
} from '/@/db/schema/extension.schema';
import type { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import {
  buildConflictUpdateColumns,
  emitDBChanges,
  mapManifestToDB,
} from '/@/utils/database-utils';
import type {
  DatabaseExtension,
  DatabaseExtensionCommandWithExtension,
  DatabaseExtensionListItem,
  DatabaseExtensionUpdatePayload,
  DatabaseExtensionCommandUpdatePayload,
  DatabaseExtensionConfig,
  DatabaseExtensionConfigWithSchema,
  DatabaseGetExtensionConfig,
  DatabaseExtensionConfigUpdatePayload,
} from '/@/interface/database.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import type { SQLiteDatabase } from './database.service';
import { MemoryCache } from '@repo/shared';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import { getExtensionConfigDefaultValue } from '/@/utils/helper';
import type { ExtensionCommandConfigValuePayload } from '#packages/common/interface/extension.interface';

class DBExtensionService {
  private cache: MemoryCache = new MemoryCache();

  constructor(private database: SQLiteDatabase) {}

  async list(
    activeExtOnly: boolean = false,
  ): Promise<DatabaseExtensionListItem[]> {
    const extensionsDbData = await this.database.query.extensions.findMany({
      columns: {
        id: true,
        icon: true,
        title: true,
        config: true,
        version: true,
        isError: true,
        isLocal: true,
        isDisabled: true,
        description: true,
        errorMessage: true,
      },
      with: {
        commands: {},
      },
      where: activeExtOnly
        ? (fields, operators) => {
            return operators.and(
              operators.eq(fields.isDisabled, false),
              operators.eq(fields.isError, false),
            );
          }
        : undefined,
    });

    return extensionsDbData;
  }

  async get(extensionId: string): Promise<DatabaseExtension | null> {
    const extension = await this.database.query.extensions.findFirst({
      with: { commands: {} },
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
    });

    return extension ?? null;
  }

  getCommands() {
    return this.database.query.commands.findMany({
      with: {
        extension: {
          columns: { isError: true, isDisabled: true },
        },
      },
    });
  }

  async getManifest(extensionId: string): Promise<ExtensionManifest | null> {
    const extension = await this.database.query.extensions.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.isError, false),
          operators.eq(fields.id, extensionId),
          operators.eq(fields.isDisabled, false),
        );
      },
      with: {
        commands: {},
      },
    });

    return extension as ExtensionManifest;
  }

  async getCommand(
    query: string | { commandId: string; extensionId: string },
  ): Promise<DatabaseExtensionCommandWithExtension | null> {
    const commandId =
      typeof query === 'string'
        ? query
        : `${query.extensionId}:${query.commandId}`;
    const result = await this.database.query.commands.findFirst({
      with: {
        extension: {
          columns: {
            id: true,
            icon: true,
            title: true,
            isError: true,
            isLocal: true,
            isDisabled: true,
            errorMessage: true,
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.id, commandId);
      },
    });

    return result ?? null;
  }

  getCommandsByExtensionId(extensionId: string) {
    return this.database.query.commands.findMany({
      where(fields, operators) {
        return operators.eq(fields.extensionId, extensionId);
      },
    });
  }

  async update(
    extensionId: string,
    { isDisabled }: DatabaseExtensionUpdatePayload,
  ) {
    await this.database
      .update(extensions)
      .set({ isDisabled, updatedAt: new Date().toISOString() })
      .where(eq(extensions.id, extensionId));

    emitDBChanges({
      'database:get-extension': [extensionId],
      'database:get-extension-list': DATABASE_CHANGES_ALL_ARGS,
    });
  }

  async upsertCommands(
    extensionId: string,
    commands: ExtensionCommand[],
    tx?: Parameters<Parameters<typeof this.database.transaction>[0]>[0],
  ) {
    const db = tx || this.database;

    const insertCommandsPayload: NewExtensionCommand[] = commands.map(
      (command) => ({
        id: `${extensionId}:${command.name}`,
        extensionId,
        ...mapManifestToDB.command(command),
      }),
    );

    await db
      .insert(commandsSchema)
      .values(insertCommandsPayload)
      .onConflictDoUpdate({
        target: commandsSchema.id,
        set: buildConflictUpdateColumns(
          commandsSchema,
          Object.keys(
            insertCommandsPayload[0],
          ) as (keyof NewExtensionCommand)[],
        ),
      });

    await db.delete(commandsSchema).where(
      and(
        eq(commandsSchema.extensionId, extensionId),
        notInArray(
          commandsSchema.id,
          insertCommandsPayload.map((command) => command.id),
        ),
      ),
    );
  }

  async configExists(configId: string) {
    return Boolean(
      await this.database.query.configs.findFirst({
        columns: {
          configId: true,
        },
        where(fields, operators) {
          return operators.eq(fields.configId, configId);
        },
      }),
    );
  }

  async getConfig({
    configId,
    extensionId,
    commandId,
  }: DatabaseGetExtensionConfig): Promise<DatabaseExtensionConfigWithSchema | null> {
    let configData: DatabaseExtensionConfigWithSchema = {
      configId,
      value: {},
      config: [],
      extensionId,
      commandIcon: '',
      commandTitle: '',
      extensionIcon: '',
      extensionTitle: '',
    };

    if (commandId) {
      const command = await this.getCommand({ commandId, extensionId });
      if (!command || !command.config) return null;

      configData = {
        ...configData,
        config: command.config,
        commandTitle: command.title,
        commandIcon: command.icon ?? '',
        extensionIcon: command.extension.icon,
        extensionTitle: command.extension.title,
      };
    } else {
      const extension = await this.get(extensionId);
      if (!extension || !extension.config) return null;

      configData = {
        ...configData,
        config: extension.config,
        extensionIcon: extension.icon,
        extensionTitle: extension.title,
      };
    }

    configData.value = (await this.getConfigValue(configId)) ?? {};

    return configData;
  }

  async getConfigValue(
    configId: string,
  ): Promise<DatabaseExtensionConfig | undefined>;
  async getConfigValue(configId: string[]): Promise<DatabaseExtensionConfig[]>;
  async getConfigValue(configIds: string | string[]): Promise<unknown> {
    if (Array.isArray(configIds)) {
      return await this.database.query.configs.findMany({
        columns: {
          id: true,
          value: true,
          configId: true,
          extensionId: true,
        },
        where(fields, operators) {
          return operators.inArray(fields.configId, configIds);
        },
      });
    }

    return await this.database.query.configs.findFirst({
      columns: {
        id: true,
        value: true,
        configId: true,
        extensionId: true,
      },
      where(fields, operators) {
        return operators.eq(fields.configId, configIds);
      },
    });
  }

  async getStorage(
    keys: string[],
    extensionId: string,
  ): Promise<Pick<SelectExtensionStorage, 'key' | 'value'>[]>;
  async getStorage(
    keys: string,
    extensionId: string,
  ): Promise<Pick<SelectExtensionStorage, 'key' | 'value'> | undefined>;
  async getStorage(
    keys: string | string[],
    extensionId: string,
  ): Promise<unknown> {
    if (typeof keys === 'string') {
      const result = await this.database.query.storages.findFirst({
        columns: {
          key: true,
          value: true,
        },
        where: (fields, { eq, and }) =>
          and(eq(fields.extensionId, extensionId), eq(fields.key, keys)),
      });

      return result;
    }

    const result = await this.database.query.storages.findMany({
      columns: {
        key: true,
        value: true,
      },
      where: (fields, { inArray, and, eq }) =>
        and(eq(fields.extensionId, extensionId), inArray(fields.key, keys)),
    });

    return result;
  }

  async storageList(extensionId: string) {
    const result = await this.database.query.storages.findMany({
      columns: {
        key: true,
        value: true,
      },
      where(fields, { eq }) {
        return eq(fields.extensionId, extensionId);
      },
    });

    return result;
  }

  async updateCommand(
    extensionId: string,
    commandId: string,
    value: DatabaseExtensionCommandUpdatePayload,
  ) {
    await this.database
      .update(commands)
      .set(value)
      .where(eq(commands.id, `${extensionId}:${commandId}`));

    emitDBChanges({
      'database:get-extension': [extensionId],
      'database:get-command': [{ commandId, extensionId }],
      'database:get-extension-list': DATABASE_CHANGES_ALL_ARGS,
    });
  }

  async insert(
    extensionData: NewExtension,
    commandsData: NewExtensionCommand[],
  ): Promise<DatabaseExtension> {
    await this.database.insert(extensions).values(extensionData);
    await this.database.insert(commandsSchema).values(commandsData).returning();

    emitDBChanges({
      'database:get-extension-list': DATABASE_CHANGES_ALL_ARGS,
    });

    const extension = await this.get(extensionData.id);

    return extension!;
  }

  async isConfigInputted(
    extensionId: string,
    commandId?: string,
  ): Promise<ExtensionCommandConfigValuePayload> {
    const configId = commandId ? `${extensionId}:${commandId}` : extensionId;
    const commandConfigCacheId = `config-inputted:${configId}`;
    if (this.cache.has(commandConfigCacheId)) {
      return { requireInput: false };
    }

    const extension = await this.get(extensionId);
    if (!extension || extension.isError) {
      throw new ExtensionError('Extension not found');
    }

    const extensionConfig = extension.config
      ? getExtensionConfigDefaultValue(extension.config)
      : null;
    if (extensionConfig?.requireInput) {
      const extensionConfigExists = await this.configExists(extension.id);
      if (!extensionConfigExists) {
        return {
          requireInput: true,
          type: 'extension',
        };
      }
    } else if (!commandId) {
      return { requireInput: false };
    }

    const command = extension.commands.find(
      (command) => command.name === commandId,
    );
    if (!command) throw new ExtensionError('Command not found');

    const commandConfig = getExtensionConfigDefaultValue(command.config ?? []);
    if (commandConfig.requireInput) {
      const commandConfigExists = await this.configExists(configId);
      if (!commandConfigExists) {
        return {
          type: 'command',
          requireInput: true,
        };
      }
    }

    this.cache.add(commandConfigCacheId, true);

    return {
      requireInput: false,
    };
  }

  async insertConfig({ configId, extensionId, value }: NewExtensionConfig) {
    await this.database.insert(configs).values({
      value,
      configId,
      extensionId,
    });
  }

  async updateConfig(
    configId: string,
    { value }: DatabaseExtensionConfigUpdatePayload,
  ) {
    await this.database
      .update(configs)
      .set({
        value,
      })
      .where(eq(configs.configId, configId));
  }
}

export default DBExtensionService;
