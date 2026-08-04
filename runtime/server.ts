import { serve } from "@hono/node-server";
import { exec } from "child_process";
import { readFile, writeFile } from "fs/promises";
import { Hono } from "hono";
import client from "./dist/index.html";
import { buildLSP, type LSP } from "./lsp.js";
import { fileURLToPath } from "url";
import { getVars } from "./getVars.ts";
import { getValueDefinition as getValueSlice } from "./getDefition.ts";
import type { Slice } from "./common.ts";

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
  const variables = await c.req.text();
  const tempFileName = crypto.randomUUID();
  const tempFile = WORKDIR + tempFileName;

  const sourcePath =
    WORKDIR + (new URL(c.req.url).searchParams.get("root") || "main.typ");
  const source = await readFile(sourcePath, { encoding: "utf8" });

  const replaced = variables ? source.replace("// ui", variables) : source;

  await writeFile(`${tempFile}.typ`, system + replaced);

  const compilerResponse = await sh(
    `typst compile ${WORKDIR + "defaults.typ"} --font-path=${WORKDIR} --input root="${tempFileName}.typ" ${tempFile}-page{0p}.svg`,
  )
    .catch(() => sh(`typst compile ${tempFile}.typ ${tempFile}-page{0p}.svg`))
    .catch(
      (e) =>
        "<pre>" +
        [
          `exit code ${e.exitCode}`,
          e.stdout.toString(),
          e.stderr.toString(),
        ].join("<br>") +
        "</pre>",
    );
  await sh(`ls ${tempFile}-page* | sort | xargs cat > ${tempFile}.svg`);

  const output = await readFile(`${tempFile}.svg`, { encoding: "utf8" });
  setTimeout(async () => {
    await sh(`rm ${tempFile}*`);
  }, 1000);
  return new Response(compilerResponse || output);
});

type FieldInfo = {
  valueSlice: Slice;
  value: string;

  argsSlice: Slice;
  args: string;

  type: "number" | "string" | "boolean";
  options?: string[];
};

async function openFile(fileUri: string) {
  const clientId = crypto.randomUUID();
  const lsp = await buildLSP(WORKDIR, fileUri);

  return {
    lsp,
    clientId,
  };
}

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

explore();
async function explore() {
  const fileUri = `file://${WORKDIR}root.typ`;
  const { lsp, clientId } = await openFile(fileUri);

  const fields = await getFields(lsp);

  // Let's say the user changed something:
  fields["number"].value = "1";
  fields["select-value"].value = "1";

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
