import { API } from '@alt-dot/shared';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class APIService extends API implements OnModuleInit {
  constructor() {
    super(import.meta.env.VITE_API_BASE_URL);
  }

  onModuleInit() {
    this.extensions.$setApiKey(import.meta.env.VITE_API_KEY);
  }
}
