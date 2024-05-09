import type { PossibleTypes } from '../interface/common.interface';

export class NodeInvalidType extends Error {
  constructor(
    invalidType: PossibleTypes,
    validTypes: PossibleTypes[],
    name?: string,
  ) {
    const types = new Intl.ListFormat('en-US').format(
      validTypes.map((val) => `"${val}"`),
    );

    super(
      `Invalid value type. ${name ? `${name} expected` : 'Expected'} ${types} but got "${invalidType}".`,
    );
  }
}
