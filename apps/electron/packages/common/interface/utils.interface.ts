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

export type AllButFirst<T extends any[]> = T extends [infer _F, ...infer H]
  ? H
  : any[];

export type AllButFirstOrLast<T extends any[]> = AllButLast<AllButFirst<T>>;

export type OmitFirstArg<F> = F extends (x: any, ...args: infer P) => infer R
  ? (...args: P) => R
  : never;

type FunctionType = (...args: any[]) => any;

export type EventMapEmit<Event> = <T extends keyof Event, K extends Event[T]>(
  name: T,
  ...args: K extends FunctionType ? Parameters<K> : K extends any[] ? K : [K]
) => K extends FunctionType ? ReturnType<K> : void;

export type SetNullable<
  BaseType,
  Keys extends keyof BaseType = keyof BaseType,
> = {
  [Key in keyof BaseType]: Key extends Keys
    ? BaseType[Key] | null
    : BaseType[Key];
};
