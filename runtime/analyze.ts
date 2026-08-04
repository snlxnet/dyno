import { buildLSP, type LSP } from "./lsp.ts";
import { getVars } from "./getVars.ts";
import { getValueDefinition as getValueSlice } from "./getDefition.ts";
import type { FieldInfo } from "./common.ts";
import { applyFields } from "./apply.ts";

const WORKDIR = "/Users/alex/repos/dyno/runtime/";
const LIB_URI = `file://${WORKDIR}lib.typ`;

async function getFields(lsp: LSP) {
  const { fileUri, initialFileBody } = lsp;

  const vars = await getVars({
    fileUri,
    fileBody: initialFileBody,
    libUri: LIB_URI,
    lsp,
  });

  const fields: [string, FieldInfo][] = [];

  for (let { variable, range, slice } of vars) {
    const valueSlice = await getValueSlice({
      fileUri,
      fileBody: initialFileBody,
      lsp,
      target: range.start,
    });

    const args = initialFileBody.slice(...slice);
    const value = initialFileBody.slice(...valueSlice);

    fields.push([
      variable,
      {
        valueSlice,
        value,
        argsSlice: slice,
        args,
        type: typeof JSON.parse(value) as "number" | "string" | "boolean",
      },
    ]);
  }

  return Object.fromEntries(fields);
}

explore();
async function explore() {
  const fileUri = `file://${WORKDIR}root.typ`;
  const lsp = await buildLSP(WORKDIR, fileUri)

  const fields = await getFields(lsp);

  // Let's say the user changed something:
  fields["number"].value = "1";
  fields["select-value"].value = "1";

  const source = applyFields({ source: lsp.initialFileBody, fields });
  console.log(source);

  lsp.exit()
}

