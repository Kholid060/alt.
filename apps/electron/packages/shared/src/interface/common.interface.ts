export type PossibleTypes =
  | 'Object'
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Null'
  | 'Undefined';

export interface PossibleTypesTypeMap {
  Null: null;
  Object: object;
  String: string;
  Number: number;
  Boolean: boolean;
  Undefined: undefined;
}
