import { Injectable } from '@nestjs/common';
import { DBService } from '../db/db.service';

@Injectable()
export class ExtensionService {
  constructor(private dbService: DBService) {}
}
