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

#set text(size: 14pt, font: "DejaVu Sans Mono")

#let number = 0
#let checkbox = false
#let string = "hello"
#let sel = "first"

#let sel-num = if sel == "first" { 1 } else if sel == "second" { 2
} else if sel == "third" { 3 }

Number: #input(number) = #number \\
Check: #input(checkbox) = #checkbox \\
String: #input(string) = #string \\

#if checkbox [
  #image("file.svg")
]

Select: #input(sel) \\
Selected: #sel-num

#for i in range(int(number)) {
  box(rect())
}
`

const typLib = `
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

async function prepareTyp(text) {
  const analysis  = await analyze(text)
  console.log(analysis.map)

  return {
    map: analysis.map,
    text: analysis.text.replace("@preview/dyno:0.1.0", "lib.typ")
  }
}

async function main() {
  let {text, map} = await prepareTyp(typMain)
  let fields = mkFields(map, updateField)
  let mainFile = "main.typ"
  
  const compiler = await createTypstCompiler({
    backend: "auto",
    worker: () => createWebWorker(workerUrl),
    coreModules: {
      "engine.core.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core.wasm`)),
      "engine.core2.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core2.wasm`)),
      "engine.core3.wasm": WebAssembly.compileStreaming(fetch(`${typstCdn}/engine/engine.core3.wasm`)),
    },
  });

  const fontNames = {
    "NewCMMath-Regular.otf": "New Computer Modern Math",
    "LibertinusSerif-Regular.otf": "Liberation Serif",
    "DejaVuSansMono.ttf": "DejaVu Sans Mono",
  }
  await Promise.all(Object.entries(fontNames).map(([f, name]) => addFont(name, `${fontsCdn}/${f}`)))

  /**
  @param {string} name The name of the font, like in `#set text(font: "...")`
  @param {string} path The URL of the font file, ends in `.ttf` or `.otf`
  */
  async function addFont(name, url) {
    const data = new Uint8Array(await (await fetch(url)).arrayBuffer())
    const font = new FontFace(name, data)
    await font.load()
    document.fonts.add(font)
    await compiler.addFonts(data);
  }

  await compiler.addSource("lib.typ", typLib)

  const root = document.getElementById("root")
  await recompile()

  const queue = []
  window.addEventListener("message", async ({data}) => {
    console.log("Queued", data.method)
    queue.push(data)
    if (queue.length === 1) {
      processMessage()
    }
  })

  async function processMessage() {
    const data = queue[0]
    console.log("Running", data)
    const method = data?.method

    if (method === "write") {
      if (data.name.endsWith(".typ")) {
        const source = new TextDecoder().decode(data.bytes)
        const analysis = await prepareTyp(source)
        text = analysis.text
        map = analysis.map
        fields = mkFields(map, updateField)
      } else {
        await compiler.addFile(data.name, data.bytes)
      }
    } else if (method === "render") {
      if (data.name) {
        mainFile = data.name
      }
      await recompile()
    }

    queue.shift()
    if (queue.length) {
      processMessage()
    }
  }

  document.addEventListener("focusin", (e) => {
    if (e.sourceCapabilities) {
      console.log(e.sourceCapabilities)
      updateField(e.target)
    }
  })
  document.addEventListener("focusout", (e) => {
    if (e.sourceCapabilities) {
      console.log(e)
      updateField(e.target, true)
    }
  })

  /**
  @param {HTMLElement} element
  @param {boolean} dontFocus
  */
  function updateField(element, dontFocus = false) {
    const id = element.id
    let value = `"${element.value}"`
    if (element.tagName === "TEXTAREA") {
      value = value.replaceAll("\n", "\\n")
    }
    if (element.type === "checkbox") {
      value = element.checked
      console.log(element.checked)
    }
    if (element.inputMode === "numeric") {
      value = +element.value
    }

    const hasFocus = document.activeElement === element
    const hasSelection = element.tagName !== "TEXTAREA" && element.selectionStart === 0
    if (!hasFocus && hasSelection) {
      element.setSelectionRange(0, 0)
    }

    const { pos, input } = map.find(it => it.id === id)
    const lines = text.split("\n")

    if (value !== null) {
      lines[pos.line] = lines[pos.line].slice(0, pos.character + 1) + "=" + value
    }

    const inputLine = lines[input.line].replaceAll(/input\(state:\d,id:/g, "input(id:")
    const beforeInput = inputLine.slice(0, input.character + 1)
    const afterInput = inputLine.slice(input.character + 1)
    let state = 1
    hasSelection && (state = 2)
    hasFocus || (state = 0)
    element.inputMode === "numeric" && element.value.endsWith(".") && (state = 3)
    lines[input.line] = `${beforeInput}state:${state},${afterInput}`

    text = lines.join("\n")
    recompile().then(() => {
      if (!dontFocus) {
        element.focus()
      }
    })
  }

  function reinsert() {
    fields.forEach((field, id) => {
      const element = getLabel(id)
      element.classList.add("dyno")

      const boundsFrame = element.parentElement.getBBox()
      element.width.baseVal.value = boundsFrame.width
      element.height.baseVal.value = boundsFrame.height

      const [_, fontSize, fontFamily, tracking, color, textAlign, alignItems, inset] = element.parentElement.dataset.typstLabel.split(";")
      field.style.fontSize = fontSize + "pt"
      field.style.fontFamily = fontFamily
      field.style.letterSpacing = tracking
      field.style.textAlign = textAlign
      field.style.alignItems = alignItems
      field.style.padding = inset

      if (field.tagName === "TEXTAREA") {
        field.style.color = color
        const typstText = element.parentElement.querySelectorAll("g")
        typstText.forEach(it => it.remove())
      }

      element.appendChild(field)
      element.onclick = field.focus
    })
  }

  async function recompile() {
    await compiler.addSource(mainFile, text)

    try {
      const {pages, diagnostics} = await compiler.compile({
        main: mainFile,
        format: "svg",
      })
      const svg = pages.map(page => page.output).join("\n\n")

      if (!svg) {
        console.log("zero pages")
        throw new Error()
      }

      if (diagnostics) {
        console.warn(...diagnostics)
      }

      root.innerHTML = svg
    } catch(e) {
      console.warn(e)
      e.diagnostics.forEach(err => console.error(`${err.line}:${err.column} ${err.message}\nHints: ${err.hints}`))
    }

    reinsert()
  }
}

function mkFields(map, updateField) {
  const fields = new Map()

  map.forEach(it => {
    const type = typeof it.value

    if (it.options) {
      const select = document.createElement("select")
      select.id = it.id

      it.options.forEach(value => {
        const option = document.createElement("option")
        option.value = value
        option.textContent = value
        select.appendChild(option)
      })
      select.value = it.value
      select.oninput = () => updateField(select)

      fields.set(it.id, select)
    } else if (type === "string") {
      const text = document.createElement("textarea")
      text.id = it.id
      text.innerHTML = it.value
      text.onkeydown = (e) => e.stopPropagation()

      text.oninput = () => {
        updateField(text)

        const isSingleLine = text.value.split("\n").length === 1
        text.style.overflow = isSingleLine ? "hidden" : "auto"
      }

      fields.set(it.id, text)
    } else {
      const input = document.createElement("input")
      input.id = it.id
      input.value = it.value
      const selectAll = () => input.setSelectionRange(0, input.value.length)
      const selectEnd = () => input.setSelectionRange(input.value.length, input.value.length)

      if (type === "boolean") {
        input.type = "checkbox"
        input.checked = it.value
        input.oninput = () => updateField(input)
      } else if (type === "number") {
        input.inputMode = "numeric"
        input.oninput = () => {
          input.value = input.value.replace(/[.,]+/, ".").replaceAll(/[^0-9.,]/g, "")
          selectEnd()
          updateField(input)
        }
        input.onkeydown = (event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault()
            event.shiftKey ? selectAll() : selectEnd()
            updateField(input)
          }
          event.stopPropagation()
        }
        input.onmousedown = () => selectEnd()
        input.onfocus = (e) => e.sourceCapabilities && selectAll()
      }

      fields.set(it.id, input)
    }
  })

  return fields
}
