import type { SQL } from 'drizzle-orm';
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  like,
  lt,
  notInArray,
  sql,
} from 'drizzle-orm';
import type {
  NewExtension,
  NewExtensionCommand,
  NewExtensionError,
  SelectExtensionConfig,
  SelectExtensionStorage,
  SelectExtensionCommand,
} from '/@/db/schema/extension.schema';
import {
  extensions,
  extensionCommands as commandsSchema,
  extensionCommands,
  extensionConfigs,
  extensionCreds,
  extensionCredOauthTokens,
  extensionErrors,
} from '/@/db/schema/extension.schema';
import type { ExtensionManifest } from '@alt-dot/extension-core';
import {
  buildConflictUpdateColumns,
  emitDBChanges,
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
  DatabaseExtensionCredOauthTokenInsertPayload,
  DatabaseExtensionCredOauthTokenUpdatePayload,
  DatabaseExtensionConfigInsertPayload,
  DatabaseExtensionErrorsListItem,
  DatabaseExtensionListFilter,
} from '/@/interface/database.interface';
import { DATABASE_CHANGES_ALL_ARGS } from '#packages/common/utils/constant/constant';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';
import type { SQLiteDatabase } from './database.service';
import { MemoryCache, parseJSON } from '@alt-dot/shared';
import { ExtensionError } from '#packages/common/errors/custom-errors';
import { getExtensionConfigDefaultValue } from '/@/utils/helper';
import type { ExtensionNeedConfigInput } from '#packages/common/interface/extension.interface';
import { safeStorage } from 'electron';
import { nanoid } from 'nanoid';
import type { ExtensionCredential } from '@alt-dot/extension-core/src/client/manifest/manifest-credential';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

const MAX_EXT_ERROR_AGE_DAY = 30;

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
    filter?: DatabaseExtensionListFilter,
  ): Promise<DatabaseExtensionListItem[]> {
    const extensionsDbData = await this.database.query.extensions.findMany({
      columns: {
        id: true,
        path: true,
        icon: true,
        title: true,
        config: true,
        version: true,
        isError: true,
        isLocal: true,
        updatedAt: true,
        isDisabled: true,
        description: true,
        errorMessage: true,
      },
      with: {
        commands: {},
      },
      extras: {
        errorsCount:
          sql<number>`(SELECT COUNT(*) FROM ${extensionErrors} WHERE ${extensionErrors.extensionId} = extensions.id)`.as(
            'errors_count',
          ),
      },
      where: (fields, operators) => {
        const filters: SQL<unknown>[] = [];

        if (filter?.activeOnly) {
          filters.push(
            operators.eq(fields.isDisabled, false),
            operators.eq(fields.isError, false),
          );
        }
        if (filter?.excludeBuiltIn) {
          filters.push(
            operators.notInArray(
              fields.id,
              Object.values(EXTENSION_BUILT_IN_ID),
            ),
          );
        }

        if (filters.length === 0) return;

        return operators.and(...filters);
      },
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

  async delete(extensionId: string) {
    if ((<string[]>Object.values(EXTENSION_BUILT_IN_ID)).includes(extensionId))
      return;

    await this.database
      .delete(extensions)
      .where(eq(extensions.id, extensionId));

    emitDBChanges({
      'database:get-extension': [extensionId],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });
  }

  async exists(extensionId: string) {
    const extension = await this.database.query.extensions.findFirst({
      columns: {
        id: true,
      },
      where(fields, operators) {
        return operators.eq(fields.id, extensionId);
      },
    });

    return Boolean(extension);
  }

  async insertError({
    title,
    message,
    extensionId,
  }: Omit<NewExtensionError, 'id' | 'createdAt' | 'updatedAt'>) {
    await this.database.insert(extensionErrors).values({
      title,
      message,
      extensionId,
      createdAt: new Date().toISOString(),
    });

    emitDBChanges({
      'database:get-extension-errors-list': [extensionId],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });
  }

  deleteOldErrors() {
    const minDate = new Date(
      new Date().setDate(new Date().getDate() - MAX_EXT_ERROR_AGE_DAY),
    );
    return this.database
      .delete(extensionErrors)
      .where(lt(extensionErrors.createdAt, minDate.toISOString()));
  }

  async deleteErrors(ids: number[]) {
    await this.database
      .delete(extensionErrors)
      .where(inArray(extensionErrors.id, ids));

    emitDBChanges({
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-errors-list': [DATABASE_CHANGES_ALL_ARGS],
    });
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
    if (!extension) return null;

    return {
      ...extension,
      categories: [],
      $apiVersion: '',
    } as ExtensionManifest;
  }

  getErrorsList(
    extensionId: string,
  ): Promise<DatabaseExtensionErrorsListItem[]> {
    return this.database.query.extensionErrors.findMany({
      columns: {
        id: true,
        title: true,
        message: true,
        createdAt: true,
      },
      where(fields, operators) {
        return operators.eq(fields.extensionId, extensionId);
      },
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt);
      },
    });
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
    commands: NewExtensionCommand[],
    tx?: Parameters<Parameters<typeof this.database.transaction>[0]>[0],
  ) {
    const db = tx || this.database;
    await db
      .insert(commandsSchema)
      .values(commands)
      .onConflictDoUpdate({
        target: commandsSchema.id,
        set: buildConflictUpdateColumns(
          commandsSchema,
          Object.keys(commands[0]) as (keyof NewExtensionCommand)[],
        ),
      });
  }

  async insertCommand(commands: DatabaseExtensionCommandInsertPayload[]) {
    await this.database.insert(extensionCommands).values(
      commands.map(
        ({
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
        }) => ({
          id: `${extensionId}:${name}`,
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
        }),
      ),
    );

    emitDBChanges({
      'database:get-command-list': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-list': [DATABASE_CHANGES_ALL_ARGS],
    });
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
  ): Promise<DatabaseExtensionConfig | null>;
  async getConfigValue(configId: string[]): Promise<DatabaseExtensionConfig[]>;
  async getConfigValue(configIds: string | string[]): Promise<unknown> {
    const mapConfigValue = ({
      id,
      value,
      configId,
      extensionId,
      encryptedValue,
    }: Pick<
      SelectExtensionConfig,
      'id' | 'configId' | 'extensionId' | 'value' | 'encryptedValue'
    >) => {
      const decryptedValue = encryptedValue
        ? parseJSON<object, object>(
            safeStorage.decryptString(encryptedValue),
            {},
          )
        : {};
      return {
        id,
        configId,
        extensionId,
        value: {
          ...value,
          ...decryptedValue,
        },
      };
    };

    if (Array.isArray(configIds)) {
      return await this.database.query.extensionConfigs
        .findMany({
          columns: {
            id: true,
            value: true,
            configId: true,
            extensionId: true,
            encryptedValue: true,
          },
          where(fields, operators) {
            return operators.inArray(fields.configId, configIds);
          },
        })
        .then((result) => result.map(mapConfigValue));
    }

    return await this.database.query.extensionConfigs
      .findFirst({
        columns: {
          id: true,
          value: true,
          configId: true,
          extensionId: true,
          encryptedValue: true,
        },
        where(fields, operators) {
          return operators.eq(fields.configId, configIds);
        },
      })
      .then((value) => (value ? mapConfigValue(value) : null));
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
      Partial<Pick<SelectExtensionCommand, 'dismissAlert'>>,
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
  ): Promise<ExtensionNeedConfigInput> {
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

  async insertConfig({
    value,
    configId,
    extensionId,
  }: DatabaseExtensionConfigInsertPayload) {
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

    await this.database.insert(extensionConfigs).values({
      configId,
      extensionId,
      value: finalValue,
      encryptedValue: hasEncryptedValue
        ? safeStorage.encryptString(JSON.stringify(encryptedValue))
        : null,
    });
  }

  async updateConfig(
    configId: string,
    { value }: DatabaseExtensionConfigUpdatePayload,
  ) {
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

    await this.database
      .update(extensionConfigs)
      .set({
        value: finalValue,
        encryptedValue: hasEncryptedValue
          ? safeStorage.encryptString(JSON.stringify(encryptedValue))
          : undefined,
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
        tokenId: extensionCredOauthTokens.id,
      })
      .from(extensionCreds)
      .leftJoin(extensions, eq(extensions.id, extensionCreds.extensionId))
      .leftJoin(
        extensionCredOauthTokens,
        eq(extensionCredOauthTokens.credentialId, extensionCreds.id),
      )
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

  async getCredentialValue(
    credentialId: string | { extensionId: string; providerId: string },
  ) {
    const result = await this.database.query.extensionCreds.findFirst({
      columns: {
        id: true,
        name: true,
      },
      where(fields, operators) {
        if (typeof credentialId === 'string') {
          return operators.eq(fields.id, credentialId);
        }

        return operators.and(
          operators.eq(fields.extensionId, credentialId.extensionId),
          operators.eq(fields.providerId, credentialId.providerId),
        );
      },
    });

    return result ?? null;
  }

  async getCredentialValueDetail(
    credentialId: string | { extensionId: string; providerId: string },
    maskSecret?: boolean,
  ) {
    const result = await this.database.query.extensionCreds.findFirst({
      with: {
        extension: {
          columns: {
            id: true,
            title: true,
            credentials: true,
          },
        },
        oauthToken: {
          columns: {
            id: true,
            expiresTimestamp: true,
          },
        },
      },
      where(fields, operators) {
        if (typeof credentialId === 'string') {
          return operators.eq(fields.id, credentialId);
        }

        return operators.and(
          operators.eq(fields.extensionId, credentialId.extensionId),
          operators.eq(fields.providerId, credentialId.providerId),
        );
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

  async getCredentialValueWithToken(
    credentialId: string | { extensionId: string; providerId: string },
  ) {
    const whereFilter =
      typeof credentialId === 'string'
        ? eq(extensionCreds.id, credentialId)
        : and(
            eq(extensionCreds.extensionId, credentialId.extensionId),
            eq(extensionCreds.providerId, credentialId.providerId),
          );

    const [result] = await this.database
      .select({
        id: extensionCreds.id,
        name: extensionCreds.name,
        providerId: extensionCreds.providerId,
        extensionId: extensionCreds.extensionId,
        oauthToken: {
          id: extensionCredOauthTokens.id,
          scope: extensionCredOauthTokens.scope,
          accessToken: extensionCredOauthTokens.accessToken,
          refreshToken: extensionCredOauthTokens.refreshToken,
          expiresTimestamp: extensionCredOauthTokens.expiresTimestamp,
        },
      })
      .from(extensionCreds)
      .where(whereFilter)
      .leftJoin(
        extensionCredOauthTokens,
        eq(extensionCreds.id, extensionCredOauthTokens.credentialId),
      )
      .limit(1);

    if (!result || !result.oauthToken) return null;

    const { accessToken, refreshToken } = result.oauthToken;
    return {
      ...result,
      oauthToken: {
        ...result.oauthToken,
        accessToken: safeStorage.decryptString(accessToken),
        refreshToken: refreshToken && safeStorage.decryptString(refreshToken),
      },
    };
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

  async deleteNotExistsCommand(
    extensionId: string,
    ids: string[],
    tx?: Parameters<Parameters<typeof this.database.transaction>[0]>[0],
  ) {
    if (ids.length === 0) return;

    const db = tx || this.database;
    await db
      .delete(commandsSchema)
      .where(
        and(
          notInArray(commandsSchema.id, ids),
          eq(commandsSchema.extensionId, extensionId),
        ),
      );
  }

  async insertCredentialOauthToken({
    scope,
    tokenType,
    accessToken,
    credentialId,
    refreshToken,
    expiresTimestamp,
  }: DatabaseExtensionCredOauthTokenInsertPayload) {
    const encryptedAccessToken = safeStorage.encryptString(accessToken);
    const encryptedRefreshToken = refreshToken
      ? safeStorage.encryptString(refreshToken)
      : null;
    const result = await this.database.insert(extensionCredOauthTokens).values({
      scope,
      tokenType,
      credentialId,
      expiresTimestamp,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });

    emitDBChanges({
      'database:get-extension-creds-value': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-creds-value-detail': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result.lastInsertRowid;
  }

  async updateCredentialOauthToken({
    scope,
    tokenType,
    accessToken,
    credentialId,
    refreshToken,
    expiresTimestamp,
  }: DatabaseExtensionCredOauthTokenUpdatePayload) {
    const encryptedAccessToken = accessToken
      ? safeStorage.encryptString(accessToken)
      : undefined;
    const encryptedRefreshToken = refreshToken
      ? safeStorage.encryptString(refreshToken)
      : undefined;
    const result = await this.database.update(extensionCredOauthTokens).set({
      scope,
      tokenType,
      credentialId,
      expiresTimestamp,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      updatedAt: new Date().toISOString(),
    });

    emitDBChanges({
      'database:get-extension-creds-value': [DATABASE_CHANGES_ALL_ARGS],
      'database:get-extension-creds-value-detail': [DATABASE_CHANGES_ALL_ARGS],
    });

    return result.lastInsertRowid;
  }

  async getCredentialOAuthToken(id: number) {
    const queryResult =
      await this.database.query.extensionCredOauthTokens.findFirst({
        columns: {
          id: true,
          scope: true,
          accessToken: true,
          refreshToken: true,
          credentialId: true,
          expiresTimestamp: true,
        },
        where(fields, operators) {
          return operators.eq(fields.id, id);
        },
      });
    if (!queryResult) return null;

    const { accessToken, refreshToken } = queryResult;
    return {
      ...queryResult,
      accessToken: safeStorage.decryptString(accessToken),
      refreshToken: refreshToken && safeStorage.decryptString(refreshToken),
    };
  }

  async deleteCredentialOAuthToken(
    tokenId: number | { extensionId: string; providerId: string },
  ) {
    if (typeof tokenId === 'number') {
      await this.database
        .delete(extensionCredOauthTokens)
        .where(eq(extensionCredOauthTokens, tokenId));
      return;
    }

    const credential = await this.database.query.extensionCreds.findFirst({
      columns: {
        id: true,
      },
      with: {
        oauthToken: {
          columns: {
            id: true,
          },
        },
      },
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.extensionId, tokenId.extensionId),
          operators.eq(fields.providerId, tokenId.providerId),
        );
      },
    });
    if (!credential?.oauthToken) return;

    await this.database
      .delete(extensionCredOauthTokens)
      .where(eq(extensionCredOauthTokens, credential.oauthToken.id));
  }

  getBackupData() {
    return this.database.query.extensions.findMany({
      columns: {
        id: true,
        isDisabled: true,
      },
      with: {
        commands: {
          columns: {
            id: true,
            name: true,
            path: true,
            type: true,
            alias: true,
            title: true,
            shortcut: true,
            isFallback: true,
            isDisabled: true,
            extensionId: true,
          },
        },
      },
      where(fields, operators) {
        return operators.eq(fields.isLocal, false);
      },
    });
  }
}

export default DBExtensionService;
