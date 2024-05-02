import { BetterMessagePortAsync } from '@repo/shared';
import type { SandboxEvents } from '../interface/sandbox.interface';

class SandboxService {
  private static _instance: SandboxService;

  static get instance() {
    return this._instance || (this._instance = new SandboxService());
  }

  private sandboxEl: HTMLIFrameElement | null = null;
  private messagePort: BetterMessagePortAsync<SandboxEvents>;

  constructor() {
    this.postMessage = this.postMessage.bind(this);
    this.onMessageHandler = this.onMessageHandler.bind(this);

    window.addEventListener('message', this.onMessageHandler);

    this.messagePort = new BetterMessagePortAsync(this.postMessage);
  }

  private onMessageHandler({ data }: MessageEvent) {
    this.messagePort.messageHandler(data);
  }

  private postMessage(data: unknown) {
    this.sandboxEl?.contentWindow?.postMessage(data, '*');
  }

  private ensureSandboxEl() {
    return new Promise<void>((resolve) => {
      if (this.sandboxEl) {
        resolve();
        return;
      }

      const iframeEl = document.createElement('iframe');
      iframeEl.src = 'sandbox://sandbox';
      iframeEl.sandbox.add('allow-scripts');

      iframeEl.onload = () => resolve();

      this.sandboxEl = iframeEl;
      document.body.appendChild(iframeEl);
    });
  }

  async evaluateCode(
    code: Record<string, string>,
    context?: Record<PropertyKey, unknown>,
  ): Promise<Record<string, unknown>>;
  async evaluateCode(
    code: string,
    context?: Record<PropertyKey, unknown>,
  ): Promise<unknown>;
  async evaluateCode(
    code: string | Record<string, string>,
    context?: Record<PropertyKey, unknown>,
  ): Promise<unknown> {
    await this.ensureSandboxEl();

    return this.messagePort.sendMessage('evaluate-code', code, context);
  }
}

export default SandboxService;
