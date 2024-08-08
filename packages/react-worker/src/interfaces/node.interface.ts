export interface Node {
  readonly type: string;
  children: (Node | string)[];
  props: Record<PropertyKey, unknown>;
}
