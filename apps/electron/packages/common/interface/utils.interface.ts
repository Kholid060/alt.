/* eslint-disable @typescript-eslint/no-explicit-any */
export type ObjectWithPrefix<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}.${K}` : never]: T[K];
};

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type KeysMatchingValueType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

export type PickEventParameters<T, K extends keyof T> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [P in K]: T[K] extends (...args: any[]) => any ? Parameters<T[K]> : [];
};

export type Last<T extends any[]> = T extends [...infer _I, infer L]
  ? L
  : T extends [...infer _I, (infer L)?]
    ? L | undefined
    : never;

export type AllButLast<T extends any[]> = T extends [...infer H, infer _L]
  ? H
  : any[];
