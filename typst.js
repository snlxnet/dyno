import { createTypstCompiler } from "https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/+esm";
import { createWebWorker } from "https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/dist/worker/browser.js";

const typstCdn = "https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/dist";

const dynoSource = `
#let input(
  body,
  id: "noid",
  state: 0,
) = context {
  let border = if state == 0 { gray } else if state == 2 { red } else { lime }
  let point = if state == 3 [.] else []

  let val = if type(body) == bool {
    if body [ on ] else [ off ]
  } else [#body#point]

  let data = json.encode((id: id, size: text.size), pretty: false)
  let flexify(align) = {
    if align == start or align == top or align == left {
      "flex-start"
    } else if align == end or align == bottom or align == right {
      "flex-end"
    } else {
      "center"
    }
  }

  let tracking = json.encode(text.tracking).slice(1, -1)
  let text-align = json.encode(align.alignment.x).slice(1, -1) + ";" + flexify(align.alignment.y)
  let inset = 2mm
  let inset-string = json.encode(inset * 0.75).slice(1, -1)

  [#box(inset: inset, stroke: 1pt+border, val)#label(id + ";" + str(text.size.pt()) + ";" + text.font + ";" + tracking + ";" + text.fill.to-hex() + ";" + text-align + ";" + inset-string)]
}

#let swap(
  ..args,
  id: "noid",
  state: 0,
) = context {
  [#box(stroke: 1mm + blue, [swap])#label(id + ";")]
}`


/**
@param {HTMLElement} loader
*/
export async function loadCompiler(loader) {
  loader.textContent = "Loading the compiler..."

  const workerEntry = `${typstCdn}/worker/web-worker.js`;
  const workerUrl = URL.createObjectURL(
    new Blob([`import ${JSON.stringify(workerEntry)};`], {
      type: "text/javascript",
    }),
  );

  const compiler = await createTypstCompiler({
    backend: "auto",
    worker: () => createWebWorker(workerUrl),
    coreModules: {
      "engine.core.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core.wasm`)),
      "engine.core2.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core2.wasm`)),
      "engine.core3.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core3.wasm`)),
    },
  });

  await compiler.addSource("dyno.typ", dynoSource)

  loader.textContent = "dyno is ready"

  return compiler
}

