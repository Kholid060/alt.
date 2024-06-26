import { Controller } from '@nestjs/common';
import { ExtensionService } from './extension.service';

@Controller()
export class ExtensionController {
  constructor(private extensionService: ExtensionService) {}
}
