import { _extension } from '@altdot/extension';
import { MailDriver } from '../../interface/driver.interface';
import {
  SheetColumnsIndex,
  SheetValues,
} from '../../interface/sheet.interface';
import { sleep } from '../helper';
import { mapColumnsRow } from '../sheet-data-parser';

const EL_SELECTOR = {
  recipientsInput: 'input[peoplekit-id]',
  emailBody: 'div[contenteditable="true"]',
  subjectInput: 'input[name="subjectbox"]',
  composeBtn: 'div[role="navigation"] div[role="button"]:not([data-tooltip])',
  sendBtn:
    'table[role="group"] div[role="button"][data-tooltip-delay]:not([aria-expanded])',
};

class GMailDriver implements MailDriver {
  constructor(
    readonly tab: _extension.Browser.Tabs.Tab,
    readonly columnsIndex: SheetColumnsIndex,
    readonly values: SheetValues,
  ) {}

  private async ensureEl(selector: string, name: string) {
    const el = await this.tab.findElement(selector);
    if (!el) {
      throw new Error(`Couldn't find the ${name} element`);
    }

    return el;
  }

  async start(): Promise<void> {
    let recipientsInputEl = await this.tab.findElement(
      EL_SELECTOR.recipientsInput,
    );
    if (!recipientsInputEl) {
      await this.tab.click(EL_SELECTOR.composeBtn);
      await sleep(200);
    }

    recipientsInputEl = await this.ensureEl(
      EL_SELECTOR.recipientsInput,
      'recipients input',
    );
    const subjectInputEl = await this.ensureEl(
      EL_SELECTOR.subjectInput,
      'subject input',
    );
    const bodyInputEl = await this.ensureEl(
      EL_SELECTOR.emailBody,
      'body input',
    );
    const sendBtn = await this.ensureEl(EL_SELECTOR.sendBtn, 'send button');

    for (const row of this.values) {
      const value = mapColumnsRow(this.columnsIndex, row);
      await recipientsInputEl.type(value.recipients);
      await subjectInputEl.type(value.subject);
      if (value.body) await bodyInputEl.type(value.body);

      await sendBtn.click();
      await sleep(100);
    }
  }
}

export default GMailDriver;
