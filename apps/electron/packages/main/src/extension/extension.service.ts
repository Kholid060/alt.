import { Injectable } from '@nestjs/common';
import { DBService } from '../db/db.service';
import { OnAppReady } from '../common/hooks/on-app-ready.hook';
import { lt } from 'drizzle-orm';
import { extensionErrors, extensions } from '../db/schema/extension.schema';
import { EXTENSION_BUILT_IN_ID } from '#packages/common/utils/constant/extension.const';

const MAX_EXT_ERROR_AGE_DAY = 3;

@Injectable()
export class ExtensionService implements OnAppReady {
  constructor(private dbService: DBService) {}

  async onAppReady() {
    // Built-in extension
    await this.dbService.db
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

    // Delete old errors
    const minDate = new Date(
      new Date().setDate(new Date().getDate() - MAX_EXT_ERROR_AGE_DAY),
    );
    this.dbService.db
      .delete(extensionErrors)
      .where(lt(extensionErrors.createdAt, minDate.toISOString()));
  }
}
