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
