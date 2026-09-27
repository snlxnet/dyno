import { analyze } from "./analyze.js"
import { createTypstCompiler } from "https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/+esm";
import { createWebWorker } from "https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/dist/worker/browser.js";

const typstCdn = "https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/dist";
const fontsCdn = "https://cdn.jsdelivr.net/npm/@typst-wasm/fonts@1.0.0/dist/files";
const workerEntry = `${typstCdn}/worker/web-worker.js`;
const workerUrl = URL.createObjectURL(
  new Blob([`import ${JSON.stringify(workerEntry)};`], {
    type: "text/javascript",
  }),
);

const typMain = `#import "@preview/dyno:0.1.0": *
#import "@preview/yap:0.1.0": *

#let number = 0
#let checkbox = true
#let string = "hello"
#let sel = "first"

#let sel-num = if sel == "first" { 1 } else if sel == "second" { 2
} else if sel == "third" { 3 }

Number: #input(number) \\
Check: #input(checkbox) \\
String: #input(string) \\

Select: #input(sel) \\
Selected: sel-num
`

const typLib = `
#let input(
  body,
  id: "noid",
) = {
  let val = if type(body) == bool {
    if body [ on ] else [ off ]
  } else [#body]

  [#box(inset: 2mm, stroke: 1pt+lime, val)#label(id)] // todo add json align & color
}`

main()

async function main() {
  const analysis  = await analyze(typMain)
  console.log(analysis.map)

  // Render
  const text = analysis.text.replace("@preview/dyno:0.1.0", "lib.typ")
  
  const compiler = await createTypstCompiler({
    backend: "auto",
    worker: () => createWebWorker(workerUrl),
    coreModules: {
      "engine.core.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core.wasm`)),
      "engine.core2.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core2.wasm`)),
      "engine.core3.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core3.wasm`)),
    },
  });

  const fontNames = ["NewCMMath-Regular.otf", "LibertinusSerif-Regular.otf"];
  await compiler.addFonts(
    ...fontNames.map(
      async (font) =>
        new Uint8Array(await (await fetch(`${fontsCdn}/${font}`)).arrayBuffer()),
    ),
  );

  await compiler.addSource("lib.typ", typLib)
  await compiler.addSource("main.typ", text)
  console.log(text)
  const {pages} = await compiler.compile({
    main: "main.typ",
    format: "svg",
  }).catch(e => e.diagnostics)

  const svg = pages.map(page => page.output).join("\n\n")
  document.getElementById("root").innerHTML = svg
}

