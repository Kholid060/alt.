import fs from 'fs-extra';
import { and, eq, notInArray } from 'drizzle-orm';
import { ExtensionUpdaterPayload } from '../interfaces/extension-updater.interface';
import { SQLiteDatabase } from '/@/db/db.service';
import {
  NewExtensionCommand,
  SelectExtension,
  extensionCommands,
  extensionConfigs,
  extensions,
} from '/@/db/schema/extension.schema';
import {
  buildConflictUpdateColumns,
  mapManifestToDB,
} from '/@/common/utils/database-utils';
import path from 'path';
import { EXTENSION_FOLDER } from '/@/common/utils/constant';

export class ExtensionUpdater {
  constructor(
    private readonly db: SQLiteDatabase,
    private readonly payload: ExtensionUpdaterPayload,
  ) {}

  async startUpdate() {
    await this.updateCommands();
    await this.updateCredentials();
    await this.updateConfig();
    await this.updateExtension();
    await this.replaceExtensionFiles();
  }

  private async updateExtension() {
    let payload: Partial<SelectExtension> | null = null;
    if (this.payload.isError) {
      if (!this.payload.extension) return;
      payload = this.payload.extension;
    } else {
      payload = mapManifestToDB.extension(this.payload.manifest);
      payload.isError = false;
      payload.errorMessage = '';
    }

    if (!payload) return;

    await this.db
      .update(extensions)
      .set({
        ...payload,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(extensions.id, this.payload.extensionId));
  }

  private async replaceExtensionFiles() {
    if (this.payload.isError || !this.payload.extDir) return;

    const extensionDir = path.join(EXTENSION_FOLDER, this.payload.extensionId);
    await fs.emptyDir(extensionDir);
    await fs.move(this.payload.extDir, extensionDir, { overwrite: true });
  }

  private async updateCommands() {
    if (this.payload.isError) return;

    const upsertCommands =
      this.payload.manifest?.commands.map((command) => ({
        ...mapManifestToDB.command(command),
        extensionId: this.payload.extensionId,
        id: `${this.payload.extensionId}:${command.name}`,
      })) ?? [];

    if (upsertCommands.length > 0) {
      await this.db
        .insert(extensionCommands)
        .values(upsertCommands)
        .onConflictDoUpdate({
          target: extensionCommands.id,
          set: buildConflictUpdateColumns(
            extensionCommands,
            Object.keys(upsertCommands[0]) as (keyof NewExtensionCommand)[],
          ),
        });
      await this.db.delete(extensionCommands).where(
        and(
          notInArray(
            extensionCommands.id,
            upsertCommands.map(({ id }) => id),
          ),
          eq(extensionCommands.extensionId, this.payload.extensionId),
        ),
      );
    } else {
      await this.db
        .delete(extensionCommands)
        .where(eq(extensionCommands.extensionId, this.payload.extensionId));
    }
  }

  private async updateCredentials() {
    if (this.payload.isError) return;

    // const extensionCredProvider =
    //   this.payload.manifest.credentials?.map(({ providerId }) => providerId) ??
    //   [];
    // await this.db
    //   .delete(extensionCreds)
    //   .where(
    //     extensionCredProvider.length === 0
    //       ? eq(extensionCreds.extensionId, this.payload.extensionId)
    //       : and(
    //           eq(extensionCreds.extensionId, this.payload.extensionId),
    //           notInArray(extensionCreds.providerId, extensionCredProvider),
    //         ),
    //   );
  }

  private async updateConfig() {
    if (this.payload.isError) return;

    const configIds = [this.payload.extensionId];
    this.payload.manifest.commands.forEach((command) => {
      configIds.push(`${this.payload.extensionId}:${command.name}`);
    });

    await this.db
      .delete(extensionConfigs)
      .where(
        and(
          eq(extensionConfigs.extensionId, this.payload.extensionId),
          notInArray(extensionConfigs.configId, configIds),
        ),
      );
  }
}
