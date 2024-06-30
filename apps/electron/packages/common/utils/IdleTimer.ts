/* eslint-disable drizzle/enforce-delete-with-where */
import EventEmitter from 'eventemitter3';

const DEFAULT_TIMEOUT_MS = 600_000; // 10 minutes

interface Events {
  idle: () => void;
}

class IdleTimer extends EventEmitter<Events> {
  static instance = new IdleTimer();

  private keys = new Set<string>();
  private timeout: NodeJS.Timeout | number = -1;

  get isLocked() {
    return this.keys.size > 0;
  }

  start(timeoutMs = DEFAULT_TIMEOUT_MS) {
    if (this.isLocked) return;
    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      if (this.isLocked) return;

      this.emit('idle');
    }, timeoutMs);
  }

  lock(key: string) {
    this.stop();
    this.keys.add(key);
  }

  unlock(key: string, startTimer = true) {
    if (this.keys.size === 0 || !this.keys.has(key)) return;

    this.keys.delete(key);
    if (!this.isLocked && startTimer) this.start();
  }

  stop() {
    clearTimeout(this.timeout);
  }
}

export default IdleTimer;
