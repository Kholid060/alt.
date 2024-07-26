import {
  SheetColumnsIndex,
  SheetRequiredColumns,
} from '../interface/sheet.interface';
import { REQUIRED_COLUMNS } from './constant';

export function getSheetColumnsIndex(firstRow: string[]) {
  const columns = new Set(Object.values(REQUIRED_COLUMNS));
  const columnsIndex: SheetColumnsIndex = {};
  firstRow.forEach((_col, index) => {
    const col = _col as SheetRequiredColumns;
    if (REQUIRED_COLUMNS.includes(col)) {
      columnsIndex[index] = col;
      columns.delete(col);
    }
  });

  console.log(JSON.stringify({ columnsIndex, firstRow }));

  if (columns.size > 0) {
    throw new Error(`Missing required columns (${[...columns].join(', ')})`);
  }

  return columnsIndex;
}

export function mapColumnsRow(columnsIndex: SheetColumnsIndex, row: string[]) {
  const rowObj = {} as Record<SheetRequiredColumns, string>;
  row.forEach((value, index) => {
    const colName = columnsIndex[index];
    if (!colName) return;

    rowObj[colName] = value;
  });

  return rowObj;
}
