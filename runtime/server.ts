import { serve } from "@hono/node-server";
import { exec } from "child_process";
import { readFile, writeFile } from "fs/promises";
import { Hono } from "hono";
import client from "./dist/index.html";

const app = new Hono();

const WORKDIR = (process.env.DYNO_DIR || "./") + "/";
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
