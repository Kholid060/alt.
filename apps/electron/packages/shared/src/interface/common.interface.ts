export type PossibleTypes =
  | 'Object'
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Null'
  | 'Array'
  | 'RegExp'
  | 'Undefined';

export interface PossibleTypesTypeMap {
  Null: null;
  Object: object;
  String: string;
  Number: number;
  RegExp: RegExp;
  Boolean: boolean;
  Undefined: undefined;
  Array: Array<unknown>;
}
