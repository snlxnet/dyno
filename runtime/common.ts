export type Location = {
  uri: string;
  range: Range;
};

export type Range = {
  start: Position;
  end: Position;
};

export type Position = {
  line: number;
  character: number;
};

export type Slice = [number, number];

export type FieldInfo = {
  valueSlice: Slice;
  value: string;

  argsSlice: Slice;
  args: string;

  type: "number" | "string" | "boolean";
  options?: string[];
};
