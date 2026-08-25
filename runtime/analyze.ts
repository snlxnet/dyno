import { buildLSP, type LSP } from "./lsp.ts";
import { getVars } from "./getVars.ts";
import { getValueDefinition as getValueSlice } from "./getDefition.ts";
import type { FieldInfo, Position, Slice } from "./common.ts";
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

async function getOptions(fileUri: URL, lsp: LSP, variable: string, target: Position, lines: string[]) {
  lsp.request("textDocument/references", {
    textDocument: { uri: fileUri },
    position: target,
    context: {
      includeDeclaration: false,
    }
  });
  return new Promise((resolve: (val: string[] | null) => void) => {
    async function handler(message: any) {
      if (!message.result || !Array.isArray(message.result) || !message.result.at(0)?.range) {
        resolve(null)
        return
      }

      const options: string[] = message.result.flatMap((entry: any) => 
        lines[entry.range.end.line].matchAll(/\s*==(.+?)(?:and|or|not|[\[{])/gm).map(([_match, value]) => value.trim()).toArray()
      )
      // TODO if it doesn't have quotes, go get the variable
      const unique = new Set(options)
      lsp.unsubscribe(handler)

      resolve(Array.from(unique));
    }

    lsp.subscribe(handler);
  });
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

    const opts = await getOptions(fileUri, lsp, variable, range, initialFileBody.split("\n"))
    if (opts) {
      console.log(variable, opts)
    }

    if (!valueSlice) {
      // not a variable, just a string that matched the RegEx
      continue
    }

    const args = initialFileBody.slice(...slice);
    const value = initialFileBody.slice(...valueSlice);

    fields.push([
      variable,
      {
        valueSlice,
        value,
        uuid: crypto.randomUUID(),
        argsSlice: slice,
        args,
        type: typeof JSON.parse(value) as "number" | "string" | "boolean",
      },
    ]);
  }

  return fields;
}

failSafe()
  .then(console.log)
  .then(() => process.exit(0));

async function explore() {
  const WORKDIR = resolve(import.meta.dirname, "..", "example");
  const lsp = await buildLSP(WORKDIR, "demo.typ");

  const fields = await getFields(lsp);
  // console.log(JSON.stringify(fields, null, 4))

  // Let's say the user changed something:
  fields.find(([key, _value]) => key == "number")![1].value = "1";
  // fields.find(([key, _value]) => key == "select-value")![1].value = "1";

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
