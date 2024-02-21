import path from 'path';
import { app } from 'electron';
import { APP_TEMP_DIR_NAME } from '#common/utils/constant/constant';

export const APP_ICON_DIR = path.join(app.getPath('temp'), app.name, APP_TEMP_DIR_NAME.appIcon);
