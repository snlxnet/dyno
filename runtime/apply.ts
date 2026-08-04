import type { FieldInfo, Slice } from "./common.ts";

export function applyFields({
  source,
  fields,
}: {
  source: string;
  fields: Record<string, FieldInfo>;
}) {
  const fieldArray = Object.entries(fields);

  const replaceArgs = fieldArray.map(([name, field]): [Slice, string] => {
    const label = `name: "${name}", `;
    const args = label + field.args;

    return [field.argsSlice, args];
  });
  const replaceValues = fieldArray.map(([_name, field]): [Slice, string] => {
    return [field.valueSlice, " " + field.value];
  });

  const replaced = applySlices(source, [
    ...replaceArgs,
    ...replaceValues,
  ]);

  return replaced;
}

function applySlices(source: string, sliceValuesUnsorted: [Slice, string][]) {
  const sliceValues = sliceValuesUnsorted.toSorted((a, b) => a[0][0] - b[0][0]);
  const chars = Array.from(source);
  let lenDiff = 0;

  sliceValues.forEach(([slice, value]) => {
    const sliceLen = slice[1] - slice[0];
    chars.splice(slice[0] + lenDiff, sliceLen, ...value.split(""));
    lenDiff += value.length - sliceLen;
  });
  return chars.join("");
}
