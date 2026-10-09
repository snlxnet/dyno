import { createTypstCompiler } from "/npm/typst.js";
import { createWebWorker } from "/npm/browser.js";

const typstCdn = "/npm";

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

  const source = await fetch("/dyno.typ")
  await compiler.addSource("dyno.typ", await source.text())

  loader.textContent = "dyno is ready"

  return compiler
}

