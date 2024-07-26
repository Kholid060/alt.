import { parse as parseCsv } from 'papaparse';
import { _extension } from '@altdot/extension';
import { getFileExt } from './helper';
import { SUPPORTED_FILE_EXT } from './constant';
import { getSheetColumnsIndex } from './sheet-data-parser';
import { SheetColumnsIndex, SheetValues } from '../interface/sheet.interface';

interface GoogleSheetSuccessData {
  range: string;
  values: SheetValues;
  majorDimension: string;
}
interface GoogleSheetErrorData {
  error: {
    code: number;
    status: string;
    message: string;
  };
}

class SheetData {
  constructor(
    readonly filePath: string,
    readonly sheet?: string,
  ) {}

  private async googleSheetExtractor(): Promise<SheetValues> {
    if (!this.sheet) {
      throw new Error('Sheet name is required when using Google Sheet');
    }

    const config = await _extension.runtime.config.getValues<{
      googleApiKey?: string;
    }>('command');
    if (!config.googleApiKey) {
      await _extension.runtime.config.openConfigPage('command');
      return [];
    }

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${this.filePath}/values/${this.sheet}?key=${config.googleApiKey}`,
    );
    const data: GoogleSheetSuccessData | GoogleSheetErrorData =
      await response.json();
    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? 'The requested google sheet not found'
          : (data as GoogleSheetErrorData)?.error?.message,
      );
    }

    return (data as GoogleSheetSuccessData).values;
  }

  private async sheetFileExtractor(): Promise<SheetValues> {
    const fileExt = getFileExt(this.filePath);
    if (!SUPPORTED_FILE_EXT.includes(fileExt)) {
      throw new Error(`"${fileExt}" file is not supported`);
    }

    let values: SheetValues = [];
    if (fileExt === 'csv') {
      const csvStr = await _extension.fs.readFile(this.filePath, {
        encoding: 'utf-8',
      });
      values = parseCsv(csvStr as string).data as SheetValues;
    }

    return values;
  }

  async getData(): Promise<{
    values: SheetValues;
    columnsIndex: SheetColumnsIndex;
  }> {
    const [firstRow, ...rows] = await (URL.canParse(this.filePath)
      ? this.sheetFileExtractor()
      : this.googleSheetExtractor());

    if (!firstRow) {
      return { values: [], columnsIndex: {} };
    }

    return {
      values: rows,
      columnsIndex: getSheetColumnsIndex(firstRow),
    };
  }
}

export default SheetData;
