import { buildLSP, type LSP } from "./lsp.ts";
import { getVars } from "./getVars.ts";
import { getValueDefinition as getValueSlice } from "./getDefition.ts";
import type { FieldInfo, Slice } from "./common.ts";
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

function stupidlyGetVars(file: string) {
  const inputs = file.matchAll(/input\((.+)\)/g).toArray().map(parts => ({args: parts[1], matchStart: parts.index + 6}))
  const potentials = inputs.flatMap(({args, matchStart}) => {
    return args.split(",")
      .reduce((prev, curr, argStart) => ([...prev, {segment: curr.trim(), idx: matchStart + argStart + prev.at(-1)!.segment.length + (curr.match(/^\s+/)?.[0]?.length || 0)}]), [{segment: "", idx: 0}])
      .filter(({segment}) => segment && !segment.includes(":"))
  })

  const lines = file.split("\n")
  const lengths = lines.map(line => line.length + 1)

  return potentials.map(({segment, idx}) => {
    let line = 0
    let sumLineLen = 0
    let done = false
    lengths.forEach(len => {
      if (sumLineLen + len >= idx) done = true
      if (done) return
      line++
      sumLineLen += len
    })

    const character = idx - sumLineLen
    const range = {line, character, idx, segment}
    const slice: Slice = [idx, idx+segment.length]
    return {
      variable: segment,
      slice,
      range,
    }
  })
}

async function getFields(lsp: LSP) {
  const { fileUri, initialFileBody } = lsp;

  const vars = stupidlyGetVars(initialFileBody)

  const fields: [string, FieldInfo][] = [];

  for (let { variable, range, slice } of vars) {
    const valueSlice = await getValueSlice({
      fileUri,
      fileBody: initialFileBody,
      lsp,
      target: range,
    }).catch(() => undefined);

    if (variable == "number") {
      console.log({slice, valueSlice})
    }

    if (!valueSlice) {
      console.log(`"${variable}" is not a variable`)
      continue
    }

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
  // lsp.subscribe((msg) => console.log(JSON.stringify(msg, null, 4)))

  const fields = await getFields(lsp);

  Object.entries(fields).forEach((v) => console.log(v))

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
