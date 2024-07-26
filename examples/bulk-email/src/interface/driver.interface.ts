export abstract class MailDriver {
  abstract start(): Promise<unknown>;
}
