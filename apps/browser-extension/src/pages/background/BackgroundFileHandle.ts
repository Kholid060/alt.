import {
  BetterMessagePortResult,
  BetterMessagePortSend,
  BrowserSelectFileOptions,
  isObject,
} from '@altdot/shared';
import { nanoid } from 'nanoid';

class BackgroundFileHandle {
  static instance = new BackgroundFileHandle();

  private files: Map<string, BrowserSelectFileOptions[]> = new Map();

  constructor() {
    this.onMessage = this.onMessage.bind(this);
    this.init();
  }

  private init() {
    self.addEventListener('message', this.onMessage);
  }

  private onMessage(message: MessageEvent<BetterMessagePortSend>) {
    if (
      !message.source ||
      !isObject(message.data) ||
      message.data.name !== 'file:request' ||
      !message.data.messageId ||
      !message.data.args
    )
      return;

    const fileId = message.data.args[0] as string;
    const files = this.files.get(fileId);
    if (!files) {
      message.source.postMessage({
        error: true,
        message: "Couldn't find files",
      });
      return;
    }

    this.files.delete(fileId);

    message.source.postMessage(
      {
        type: 'result',
        result: files,
        name: message.data.messageId,
      } as BetterMessagePortResult,
      { transfer: files.map((file) => file.contents) },
    );
  }

  addFiles(files: BrowserSelectFileOptions[]) {
    const fileId = nanoid(5);
    this.files.set(fileId, files);

    return fileId;
  }
}

export default BackgroundFileHandle;
