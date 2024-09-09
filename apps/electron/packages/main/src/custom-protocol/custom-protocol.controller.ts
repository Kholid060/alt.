import { Controller } from '@nestjs/common';
import { CustomProtocol } from '../common/decorators/protocol.decorator';
import { CUSTOM_SCHEME } from '#packages/common/utils/constant/constant';
import { Payload } from '@nestjs/microservices';
import { CustomProtocolService } from './custom-protocol.service';

@Controller()
export class CustomProtocolController {
  constructor(private customProtocolService: CustomProtocolService) {}

  @CustomProtocol(CUSTOM_SCHEME.fileIcon)
  handleFileIconProtocol(@Payload() [req]: [GlobalRequest]) {
    return this.customProtocolService.handleFileIconProtocol(req);
  }

  @CustomProtocol(CUSTOM_SCHEME.extension, { privilege: { standard: true } })
  handleExtensionProtocol(@Payload() [req]: [GlobalRequest]) {
    return this.customProtocolService.handleExtensionProtocol(req);
  }

  @CustomProtocol(CUSTOM_SCHEME.imagePreview, { privilege: { standard: true } })
  handleImagePreview(@Payload() [req]: [GlobalRequest]) {
    return this.customProtocolService.handleImagePreview(req);
  }
}
