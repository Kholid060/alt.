import { API } from '@alt-dot/shared';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppEnv } from '../common/validation/app-env.validation';

@Injectable()
export class APIService extends API {
  constructor(private config: ConfigService<AppEnv, true>) {
    super(config.get('VITE_API_BASE_URL'), config.get('API_KEY'));
  }
}
