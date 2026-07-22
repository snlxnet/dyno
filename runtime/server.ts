import { serve } from "@hono/node-server";
import { exec } from "child_process";
import { readFile, writeFile } from "fs/promises";
import { Hono } from "hono";
import client from "./dist/index.html";
import { buildLSP, type LSP } from "./lsp.js";
import { getVars } from "./getVars.ts";
import { getValueDefinition as getValueSlice } from "./getDefition.ts";
import type { Slice } from "./common.ts";
import { pathToFileURL } from "url";

const app = new Hono();

const WORKDIR = "/Users/alex/repos/dyno/runtime/"; // (process.env.DYNO_DIR || "./") + "/";
const LIB_URI = `file://${WORKDIR}lib.typ`;
const PORT = +(process.env.DYNO_PORT || 3000);

const system = `#let window-width = 1280
#let window-height = 720
#let cm = 38
#let focus = ""
`;

app.get("/", (c) => c.html(client));
app.get("/font", async (c) => {
  const name = new URL(c.req.url).searchParams.get("name")!;
  const otf = await readFile(WORKDIR + name + ".otf").catch(() => null);
  const ttf = await readFile(WORKDIR + name + ".ttf").catch(() => null);
  const font = otf || ttf || "not found";
  const mime = otf ? "font/otf" : "font/ttf";

  return new Response(font, { headers: { "Content-Type": mime } });
});
app.post("/compile", async (c) => {
  const params = new URL(c.req.url).searchParams;
  const variables: Record<string, any> = await c.req.json();
  const clientId = params.get("client") || crypto.randomUUID();

  const sourcePath = WORKDIR + (params.get("root") || "main.typ");
  const sourceUri = pathToFileURL(sourcePath);

  await compile(sourceUri.toString(), variables, clientId);

  const output = await readFile(`${WORKDIR + clientId}.svg`, {
    encoding: "utf8",
  });
  return new Response(output);
});

type FieldInfo = {
  valueSlice: Slice;
  value: string;

  argsSlice: Slice;
  args: string;

  type: "number" | "string" | "boolean";
  options?: string[];
};

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

async function applyFields({
  lsp,
  fields,
  clientId,
}: {
  lsp: LSP;
  fields: Record<string, FieldInfo>;
  clientId: string;
}) {
  const { initialFileBody, fileUri, filePath } = lsp;
  const fieldArray = Object.entries(fields);

  const replaceArgs = fieldArray.map(([name, field]): [Slice, string] => {
    const label = `name: "${name}", `;
    const args = label + field.args;

    return [field.argsSlice, args];
  });
  const replaceValues = fieldArray.map(([_name, field]): [Slice, string] => {
    return [field.valueSlice, " " + field.value];
  });

  const replaced = applySlices(initialFileBody, [
    ...replaceArgs,
    ...replaceValues,
  ]);

  lsp.notify("textDocument/didChange", {
    textDocument: { uri: fileUri, version: 1 },
    contentChanges: [{ text: replaced }],
  });

  await lsp.request("workspace/executeCommand", {
    command: "tinymist.exportSvg",
    arguments: [filePath, { pageNumberTemplate: `${clientId}`, merge: {} }],
  });

  return replaced;
}

async function compile(
  fileUri: string,
  variables: Record<string, any>,
  clientId: string,
) {
  const lsp = await buildLSP(WORKDIR, fileUri);

  const fields = await getFields(lsp);

  console.log(Object.entries(variables));
  Object.entries(variables).forEach(([key, value]) => {
    if (!fields[key]) return;

    fields[key].value = `${value}`;
  });

  console.log({ fields });

  const source = await applyFields({ lsp, fields, clientId });
  console.log(source);
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

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  (info) => {
    console.log(`Server is running on port ${info.port}`);
  },
);

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
