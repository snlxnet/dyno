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

Number: #input(number) = #number \\
Check: #input(checkbox) = #checkbox \\
String: #input(string) = #string \\

Select: #input(sel) \\
Selected: #sel-num
`

const typLib = `
#let input(
  body,
  id: "noid",
) = context {
  let val = if type(body) == bool {
    if body [ on ] else [ off ]
  } else [#body]

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

  let text-align = json.encode(align.alignment.x).slice(1, -1) + ";" + flexify(align.alignment.y)
  let inset = 2mm
  let inset-string = json.encode(inset * 0.75).slice(1, -1)

  [#box(inset: inset, stroke: 1pt+lime, val)#label(id + ";" + str(text.size.pt()) + ";" + text.font + ";" + text.fill.to-hex() + ";" + text-align + ";" + inset-string)]
}`

main()

function getLabel(label) {
  const anchor = document.querySelector(`[data-typst-label^="${label};"]`);

  if (!anchor) {
    return undefined;
  }

  const existing = anchor.querySelector("foreignObject");

  if (existing) {
    return existing;
  }

  const foreign = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "foreignObject",
  );
  anchor.appendChild(foreign);

  return foreign;
}

async function main() {
  const analysis  = await analyze(typMain)
  console.log(analysis.map)

  // Render
  let text = analysis.text.replace("@preview/dyno:0.1.0", "lib.typ")
  
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

  const root = document.getElementById("root")
  await recompile()

  // Insert inputs
  const fields = new Map()
  analysis.map.forEach(it => {
    if (it.options) {
      const select = document.createElement("select")
      select.id = it.id

      it.options.forEach(value => {
        const option = document.createElement("option")
        option.value = value
        option.textContent = value
        select.appendChild(option)
      })

      select.oninput = () => updateField(it.id, select.value, select)

      fields.set(it.id, select)
    } else {
      const input = document.createElement("input")
      const type = typeof it.value
      input.id = it.id
      input.value = it.value
      input.onkeydown = (e) => e.stopPropagation()

      if (type === "boolean") {
        input.type = "checkbox"
        input.checked = it.value
        input.oninput = () => updateField(it.id, input.checked, input)
      } else if (type === "number") {
        input.type = "number"
        input.oninput = () => updateField(it.id, +input.value, input)
      } else {
        input.oninput = () => updateField(it.id, input.value, input)
      }

      fields.set(it.id, input)
    }
  })
  reinsert()

  /**
  @param {string} id
  @param {string | number | boolean} value
  @param {HTMLElement} element
  */
  function updateField(id, value, element) {
    root.appendChild(element)
    const { pos } = analysis.map.find(it => it.id === id)
    const lines = text.split("\n")
    lines[pos.line] = lines[pos.line].slice(0, pos.character + 1) + `= ${JSON.stringify(value)}`
    text = lines.join("\n")
    recompile().then(() => {
      reinsert()
      element.focus()
    })
  }

  function reinsert() {
    fields.forEach((field, id) => {
      const element = getLabel(id)
      element.classList.add("dyno")

      const boundsFrame = element.parentElement.getBBox()
      element.width.baseVal.value = boundsFrame.width
      element.height.baseVal.value = boundsFrame.height

      const [_, fontSize, fontFamily, color, textAlign, alignItems, inset] = element.parentElement.dataset.typstLabel.split(";")
      field.style.fontSize = fontSize + "pt"
      field.style.fontFamily = fontFamily
      field.style.caretColor = color
      field.style.textAlign = textAlign
      field.style.alignItems = alignItems
      field.style.padding = inset

      element.appendChild(field)
      element.onclick = field.focus
    })
  }

  async function recompile() {
    await compiler.addSource("main.typ", text)
    console.log(text)
    const {pages} = await compiler.compile({
      main: "main.typ",
      format: "svg",
    }).catch(e => console.warn(...e.diagnostics))

    const svg = pages.map(page => page.output).join("\n\n")
    root.innerHTML = svg
  }
}

