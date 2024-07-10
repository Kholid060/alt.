import { PipeTransform } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ZodSchema } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown) {
    try {
      const parsedValue = this.schema.parse(value);
      return parsedValue;
    } catch (_error) {
      throw new RpcException('Validation failed');
    }
  }
}
