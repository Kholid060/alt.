import type { PossibleTypes } from '../interface/common.interface';

export class NodeInvalidType extends Error {
  constructor(invalidType: PossibleTypes, validTypes: PossibleTypes[]) {
    const types = new Intl.ListFormat('en-US').format(
      validTypes.map((val) => `"${val}"`),
    );
    super(`Invalid value type. Expected ${types} but got "${invalidType}".`);
  }
}
