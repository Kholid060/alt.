import { API } from '@alt-dot/shared';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from '../common/validation/app-env.validation';

@Injectable()
export class APIService extends API implements OnModuleInit {
  constructor(private config: ConfigService<AppEnv, true>) {
    super(import.meta.env.VITE_API_BASE_URL);
  }

  onModuleInit() {
    this.extensions.$setApiKey(this.config.get('API_KEY'));
  }
}
