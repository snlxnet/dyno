import { buildLSP, type LSP } from "./lsp.ts";
import { getVars } from "./getVars.ts";
import { getValueDefinition as getValueSlice } from "./getDefition.ts";
import type { FieldInfo } from "./common.ts";
import { applyFields } from "./apply.ts";
import { pathToFileURL } from "url";
import { exec } from "child_process";
import { resolve } from "path";

const DYNO_VERSION = "0.1.0"

async function sh(command: string): Promise<string> {
  console.log("$ " + command);
  return new Promise((resolve, reject) => {
    exec(command, (exitCode, stdout, stderr) => {
      if (exitCode) {
        reject({ exitCode, stdout, stderr });
        return;
      }
      resolve(stdout);
    });
  });
}

async function getFields(lsp: LSP) {
  const { fileUri, initialFileBody } = lsp;

  const {packages} = await sh("typst info --format=json").then(JSON.parse)
  const libUri = pathToFileURL(`${packages["package-cache-path"]}/preview/dyno/${DYNO_VERSION}/lib.typ`)

  const vars = await getVars({
    fileBody: initialFileBody,
    libUri,
    lsp,
  });
  console.log(vars)

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

failSafe()
  .then(console.log)
  .then(() => process.exit(0));

async function explore() {
  const WORKDIR = resolve(import.meta.dirname, "..", "example");
  const lsp = await buildLSP(WORKDIR, "demo.typ");
  lsp.subscribe((msg) => console.log(JSON.stringify(msg, null, 4)))

  const fields = await getFields(lsp);

  // Let's say the user changed something:
  fields["number"].value = "1";
  fields["select-value"].value = "1";

  const source = applyFields({ source: lsp.initialFileBody, fields });
  lsp.exit();
  return source;
}

async function failSafe() {
  let result: string;

  return new Promise((resolve) => {
    explore().then((val) => {
      result = val;
      resolve(result);
    });
    setTimeout(() => {
      if (result === undefined) {
        failSafe().then(resolve);
      }
    }, 100);
  });
}
