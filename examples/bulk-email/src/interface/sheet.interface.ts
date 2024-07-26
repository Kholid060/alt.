import { REQUIRED_COLUMNS } from '../utils/constant';

export type SheetValues = string[][];

export type SheetRequiredColumns = (typeof REQUIRED_COLUMNS)[number];

export type SheetColumnsIndex = Record<number, SheetRequiredColumns>;
