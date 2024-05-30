import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  notInArray,
} from 'drizzle-orm';
import type {
  NewExtension,
  NewExtensionCommand,
  NewExtensionConfig,
  SelectExtensionStorage,
  SelectExtesionCommand,
} from '/@/db/schema/extension.schema';
import {
  extensions,
  extensionCommands as commandsSchema,
  extensionCommands,
  extensionConfigs,
  extensionCreds,
} from '/@/db/schema/extension.schema';
import type { ExtensionCommand, ExtensionManifest } from '@repo/extension-core';
import {
  buildConflictUpdateColumns,
  emitDBChanges,
  mapManifestToDB,
  withPagination,
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
  DatabaseExtensionCommandInsertPayload,
  DatabaseExtensionCommandListFilter,
  DatabaseExtensionCredentials,
  DatabaseExtensionCredentialInsertPayload,
  DatabaseExtensionCredentialUpdatePayload,
  DatabaseExtensionCredentialsValueList,
  DatabaseExtensionCredentialsValueDetail,
  DatabaseExtensionCredentialsValueListOptions,
} from '/@/interface/database.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import type { SQLiteDatabase } from './database.service';
import { MemoryCache, parseJSON } from '@repo/shared';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import { getExtensionConfigDefaultValue } from '/@/utils/helper';
import type { ExtensionCommandConfigValuePayload } from '#packages/common/interface/extension.interface';
import { safeStorage } from 'electron';
import { nanoid } from 'nanoid';
import type { ExtensionCredential } from '@repo/extension-core/src/client/manifest/manifest-credential';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

class DBExtensionService {
  private cache: MemoryCache = new MemoryCache();

  constructor(private database: SQLiteDatabase) {}

  async $initialData() {
    // Extension for user script
    await this.database
      .insert(extensions)
      .values({
        path: '',
        author: 'user',
        description: '',
        version: '0.0.0',
        icon: 'icon:FileCode',
        title: 'User Scripts',
        id: EXTENSION_BUILT_IN_ID.userScript,
        name: EXTENSION_BUILT_IN_ID.userScript,
      })
      .onConflictDoNothing({ target: extensions.id });
  }

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

  getCommands(filter?: DatabaseExtensionCommandListFilter) {
    return this.database.query.extensionCommands.findMany({
      where(fields, operators) {
        if (!filter) return;

        switch (filter) {
          case 'user-script':
            return operators.and(
              operators.isNotNull(fields.path),
              operators.eq(fields.type, 'script'),
            );
        }
      },
    });
  }

  getCredentials(): Promise<DatabaseExtensionCredentials> {
    return this.database.query.extensions.findMany({
      columns: {
        id: true,
        title: true,
        credentials: true,
      },
      where(fields, operators) {
        return operators.isNotNull(fields.credentials);
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
    const result = await this.database.query.extensionCommands.findFirst({
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

    return result as DatabaseExtensionCommandWithExtension;
  }

  getCommandsByExtensionId(extensionId: string) {
    return this.database.query.extensionCommands.findMany({
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
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });
  }

  async deleteCommand(id: string | string[]) {
    await this.database
      .delete(extensionCommands)
      .where(
        Array.isArray(id)
          ? inArray(extensionCommands.id, id)
          : eq(extensionCommands.id, id),
      );
    emitDBChanges({
      'database:get-extension': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
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

  async insertCommand({
    name,
    type,
    icon,
    path,
    title,
    config,
    context,
    shortcut,
    subtitle,
    isDisabled,
    isFallback,
    extensionId,
    description,
    arguments: commandArgs,
  }: DatabaseExtensionCommandInsertPayload) {
    const id = `${extensionId}:${name}`;
    await this.database.insert(extensionCommands).values({
      id,
      name,
      type,
      icon,
      path,
      title,
      config,
      context,
      shortcut,
      subtitle,
      isDisabled,
      isFallback,
      extensionId,
      description,
      arguments: commandArgs,
    });

    emitDBChanges({
      'database:get-command-list': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });

    return id;
  }

  async configExists(configId: string) {
    return Boolean(
      await this.database.query.extensionConfigs.findFirst({
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
      if (!command || !command.config || !command.extension) return null;

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
      return await this.database.query.extensionConfigs.findMany({
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

    return await this.database.query.extensionConfigs.findFirst({
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
      const result = await this.database.query.extensionStorages.findFirst({
        columns: {
          key: true,
          value: true,
        },
        where: (fields, { eq, and }) =>
          and(eq(fields.extensionId, extensionId), eq(fields.key, keys)),
      });

      return result;
    }

    const result = await this.database.query.extensionStorages.findMany({
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
    const result = await this.database.query.extensionStorages.findMany({
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
    {
      alias,
      shortcut,
      subtitle,
      isFallback,
      isDisabled,
      dismissAlert,
      customSubtitle,
    }: DatabaseExtensionCommandUpdatePayload &
      Partial<Pick<SelectExtesionCommand, 'dismissAlert'>>,
  ) {
    await this.database
      .update(extensionCommands)
      .set({
        alias,
        shortcut,
        subtitle,
        isFallback,
        isDisabled,
        dismissAlert,
        customSubtitle,
      })
      .where(eq(extensionCommands.id, `${extensionId}:${commandId}`));

    emitDBChanges({
      'database:get-extension': [extensionId],
      'database:get-command': [{ commandId, extensionId }],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });
  }

  async insert(
    extensionData: NewExtension,
    commandsData: NewExtensionCommand[],
  ): Promise<DatabaseExtension> {
    await this.database.transaction(async (tx) => {
      await tx.insert(extensions).values(extensionData);
      await tx.insert(commandsSchema).values(commandsData);
    });

    emitDBChanges({
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
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
    await this.database.insert(extensionConfigs).values({
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
      .update(extensionConfigs)
      .set({
        value,
      })
      .where(eq(extensionConfigs.configId, configId));
  }

  async insertCredential({
    type,
    name,
    value,
    providerId,
    extensionId,
  }: DatabaseExtensionCredentialInsertPayload) {
    const id = nanoid();
    const encryptedValue = safeStorage.encryptString(JSON.stringify(value));

    await this.database.insert(extensionCreds).values({
      id,
      name,
      type,
      providerId,
      extensionId,
      value: encryptedValue,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    emitDBChanges({
      'database:get-extension-creds-value': [DATABASE_CHANGES_ALL_ARGS],
    });

    return id;
  }

  async updateCredential(
    credentialId: string,
    { name, value }: DatabaseExtensionCredentialUpdatePayload,
  ) {
    const updatedValue = value;
    if (updatedValue) {
      Object.keys(value).forEach((key) => {
        if (key.startsWith('__MASK_VALUE__')) {
          delete updatedValue[key];
        }
      });
    }

    const encryptedValue = updatedValue
      ? safeStorage.encryptString(JSON.stringify(updatedValue))
      : undefined;
    await this.database
      .update(extensionCreds)
      .set({
        name,
        value: encryptedValue,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(extensionCreds.id, credentialId));

    emitDBChanges({
      'database:get-extension-creds-value-detail': [credentialId],
      'database:get-extension-creds-value': [DATABASE_CHANGES_ALL_ARGS],
    });
  }

  async getCredentialValueList({
    sort,
    filter,
    pagination,
  }: DatabaseExtensionCredentialsValueListOptions = {}): Promise<{
    count: number;
    items: DatabaseExtensionCredentialsValueList;
  }> {
    let query = this.database
      .select({
        id: extensionCreds.id,
        name: extensionCreds.name,
        type: extensionCreds.type,
        updatedAt: extensionCreds.updatedAt,
        createdAt: extensionCreds.createdAt,
        providerId: extensionCreds.providerId,
        extension: {
          id: extensions.id,
          title: extensions.title,
        },
      })
      .from(extensionCreds)
      .leftJoin(extensions, eq(extensions.id, extensionCreds.extensionId))
      .$dynamic();

    if (filter?.extensionId) {
      query = query.where(eq(extensionCreds.extensionId, filter.extensionId));
    }
    if (filter?.name) {
      query = query.where(like(extensionCreds.name, `%${filter.name}%`));
    }

    if (sort) {
      let sortColumn: SQLiteColumn = extensionCreds.createdAt;
      switch (sort.by) {
        case 'updatedAt':
          sortColumn = extensionCreds.updatedAt;
          break;
        case 'name':
          sortColumn = extensionCreds.name;
          break;
      }

      query = query.orderBy(sort.asc ? asc(sortColumn) : desc(sortColumn));
    }
    if (pagination) {
      query = withPagination(query, pagination.page, pagination.pageSize);
    }

    const items =
      (await query.execute()) as DatabaseExtensionCredentialsValueList;
    const itemsLength = filter
      ? items.length
      : (await this.database.select({ count: count() }).from(extensionCreds))[0]
          .count;

    return { items, count: itemsLength };
  }

  async getCredentialValueDetail(credentialId: string, maskSecret?: boolean) {
    const result = await this.database.query.extensionCreds.findFirst({
      with: {
        extension: {
          columns: {
            id: true,
            title: true,
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.id, credentialId);
      },
    });
    if (!result) return null;

    const finalResult = {
      ...result,
      value: parseJSON(safeStorage.decryptString(result.value), {}),
    } as DatabaseExtensionCredentialsValueDetail;
    if (!maskSecret) return finalResult;

    switch (finalResult.type) {
      case 'oauth2':
        finalResult.value.clientSecret = `__MASK_VALUE__${result.id}`;
        break;
    }

    return finalResult;
  }

  async deleteCredentials(ids: string | string[]) {
    const idsArr = Array.isArray(ids) ? ids : [ids];
    await this.database
      .delete(extensionCreds)
      .where(inArray(extensionCreds.id, idsArr));

    emitDBChanges({
      'database:get-extension-creds-value': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-creds-value-detail': [DATABASE_CHANGES_ALL_ARGS],
    });
  }

  async deleteNotExistsCreds(
    extensionId: string,
    credentials: ExtensionCredential[],
    tx?: Parameters<Parameters<typeof this.database.transaction>[0]>[0],
  ) {
    const db = tx || this.database;
    const credsValue = await db.query.extensionCreds.findMany({
      columns: {
        id: true,
        providerId: true,
      },
      where(fields, operators) {
        return operators.eq(fields.extensionId, extensionId);
      },
    });
    const currentCreds = new Set(credentials.map((item) => item.providerId));
    const notExistsCreds = credsValue.reduce<string[]>((acc, item) => {
      if (!currentCreds.has(item.providerId)) {
        acc.push(item.providerId);
      }

      return acc;
    }, []);

    if (notExistsCreds.length === 0) return;

    await db
      .delete(extensionCreds)
      .where(notInArray(extensionCreds.id, notExistsCreds));
  }
}

export default DBExtensionService;
