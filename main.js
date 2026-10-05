import { analyze } from "./analyze.js"
import { loadCompiler } from "./typst.js";
import { createQueue } from "./queue.js"

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

  return {
    map: analysis.map,
    text: analysis.text.replace("@local/dyno:0.1.0", "dyno.typ")
  }
}

async function main() {
  const loader = document.getElementById("loader")
  let text, map, fields, mainFile, compiler
  
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

  const root = document.getElementById("root")

  const queueCommand = createQueue(processMessage)
  queueCommand({ method: "init" })
  window.addEventListener("message", ({data}) => queueCommand(data))

  const queueRender = createQueue(recompile)
  async function render() {
    return new Promise(resolve => queueRender(resolve))
  }

  async function processMessage(data) {
    const method = data?.method

    if (method === "init") {
      compiler = await loadCompiler(loader)
    } else if (method === "setMain") {
      if (data.name) {
        mainFile = data.name
      }

      const source = new TextDecoder().decode(data.bytes)
      const analysis = await prepareTyp(source)
      text = analysis.text
      map = analysis.map
      fields = mkFields(map, updateField)

      if (text.includes(`"@preview/yap:`)) {
        document.body.classList.remove("disable-yap")
      } else {
        document.body.classList.add("disable-yap")
      }
    } else if (method === "write") {
      await compiler.addFile(data.name, data.bytes)
    } else if (method === "render") {
      await render()
    } else if (method === "font") {
      await addFont(data.name, data.url)
    }

    console.log("done")
  }

  let ignoreFocusOn = null
  let isMouseDown = false
  document.addEventListener("mousedown", () => isMouseDown = true)
  document.addEventListener("mouseup", () => isMouseDown = false)
  document.addEventListener("focusin", (e) => {
    if (e.target.tagName === "SELECT" && isMouseDown) {
      return
    }

    if (ignoreFocusOn !== e.target) {
      console.log("FOCUS")
      updateField(e.target)
    }
  })
  document.addEventListener("focusout", (e) => {
    if (ignoreFocusOn !== e.target) {
      console.log("BLUR")
      updateField(e.target, true)
    }
  })

  /**
  @param {HTMLElement} element
  @param {boolean} dontFocus
  @param {Function} onCompleted
  */
  function updateField(element, dontFocus = false, onCompleted = undefined) {
    if (!dontFocus) {
      ignoreFocusOn = element
    }

    const id = element.id
    let value = `"${element.value}"`
    if (element.tagName === "TEXTAREA") {
      value = value.replaceAll("\n", "\\n")
    }
    if (element.type === "button") {
      value = element.value
    }
    if (element.inputMode === "numeric") {
      value = +element.value
    }

    const hasFocus = document.activeElement === element
    const hasSelection = element.tagName !== "TEXTAREA" && element.selectionStart === 0
    if (!hasFocus && hasSelection) {
      element.setSelectionRange(0, 0)
    }

    const { pos, input, swap } = map.find(it => it.id === id)
    const lines = text.split("\n")

    if (input && value !== null) {
      lines[pos.line] = lines[pos.line].slice(0, pos.character + 1) + "=" + value
    }

    const fn = input || swap

    const line = lines[fn.line]
      .replaceAll(/input\(state:\d,id:/g, "input(id:")
      .replaceAll(/swap\(state:\d,id:/g, "swap(id:")
    const before = line.slice(0, fn.character + 1)
    const after = line.slice(fn.character + 1)
    let state = 1
    hasSelection && (state = 2)
    hasFocus || (state = 0)
    element.inputMode === "numeric" && element.value.endsWith(".") && (state = 3)
    lines[fn.line] = `${before}state:${state},${after}`

    text = lines.join("\n")
    render().then(() => {
      if (!dontFocus) {
        element.focus()
        ignoreFocusOn = null
      }
      onCompleted?.()
    })
  }

  function reinsert() {
    fields.forEach((field, id) => {
      const element = getLabel(id)
      if (!element) {
        console.log(`Field ${id} is hidden`)
        return
      }
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

      const proxy = document.createElement("label")
      proxy.appendChild(field)
      element.appendChild(proxy)
    })
  }

  async function recompile(onCompleted) {
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
    reload() // call yap
    onCompleted?.()
  }
}

function mkFields(map, updateField) {
  const fields = new Map()

  map.forEach(it => {
    const type = typeof it.value

    if (it.kind === "swap") {
      const button = document.createElement("button")
      button.id = it.id

      button.onmousedown = () => {
        const a = fields.get(it.a.end.line + ":" + it.a.end.character)
        const b = fields.get(it.b.end.line + ":" + it.b.end.character)

        const copied = a.value
        a.value = b.value
        b.value = copied

        document.activeElement?.blur()
        updateField(a, true)
        updateField(b, true, () => button.focus())
      }
      button.onkeyup = (e) => e.code === "Space" && button.onmousedown()

      fields.set(it.id, button)
    } else if (it.options) {
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
        input.type = "button"
        input.value = it.value
        input.onmousedown = () => {
          input.value = !(input.value === "true")
          document.activeElement?.blur()
          updateField(input, false, () => input.focus())
        }
        input.onkeyup = (e) => e.code === "Space" && input.onmousedown()
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
