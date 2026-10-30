#import "@preview/catppuccin:1.1.0": catppuccin, flavors, set-code-theme
#import "site/main.typ": theme
#set document(
  title: "dyno web | snlx.net",
  description: "How electric motors work",
)
#show: catppuccin.with(flavors.mocha)
#show: theme("/dyno", "/ru/dyno", "/src/card.svg", "dark", 0)

= Web Compiler

#html.style(```css
@media print {
  body * {
    display: none;
  }
  body::before {
    content: "Please check the downloaded file";
  }
}
button {
  border: 0.1em solid #000;
  border-radius: 0.3em;
  color: inherit;
  font-family: inherit;
  font-size: inherit;
  background: #2e2d39;
  padding: 0.6em;
  transition: ease-out 0.2s;
  cursor: pointer;
}
button:hover {
  border-color: #a8a5ff;
}

iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100svh;
  border: none;
  box-sizing: border-box;
}

#diag:empty {
  display: none;
}
#diag {
  display: block;
  position: absolute;
  bottom: 1em;
  left: 1em;
  right: 1em;
}
```.text)

#html.button(
  id: "folder",
)[Select folder]

#html.iframe(
  id: "engine",
  src: "/engine",
  style: "display: none",
)
#html.div(id: "diag")

#html.script(```js
let dir
let ready = false
let isEmpty = true
let timer = null
let main = "/main.typ"

const DYNO = [
  "dyno.typ",
  "server.js",
  "src/index.html",
  "src/engine.html",
  "src/yap.css",
  "src/main.js",
  "src/analyze.js",
  "src/typst.js",
  "src/queue.js",
  "src/yap.js",
  "src/card.svg",
  "src/favicon.svg",
  "src/npm/browser.js",
  "src/npm/typ_js.js",
  "src/npm/typ_js_bg.wasm",
  "src/npm/engine/engine.core2.wasm",
  "src/npm/engine/engine.core3.wasm",
  "src/npm/engine/engine.core.wasm",
  "src/tinymist/pkg/tinymist.js",
  "src/tinymist/pkg/tinymist_bg.wasm",
]

function run() {
  if (!dir) return
  console.log({main})

  clearTimeout(timer)
  timer = setTimeout(async () => {
    engine.contentWindow.postMessage({method: "reset"})
    await readDir(dir)
    if (isEmpty) {
      await downloadTemplate()
    }
    engine.contentWindow.postMessage({method: "render"})
  }, 200)
}

folder.addEventListener("click", async () => {
  if (!window.FileSystemObserver) {
    alert("Unsupported browser - please use current Chrome / Edge / Yandex on a computer")
  }

  dir = await window.showDirectoryPicker({ id: "dyno", mode: "readwrite" })
  engine.style.display = ""
  if (!ready) return

  new FileSystemObserver(run).observe(dir)
  run()
})
window.addEventListener("message", ({data}) => {
  const { err, status } = data
  if (status === "listening") {
    ready = true
    run()
  }
  diag.innerHTML = ""
  if (!err.length) return
  err.map(err => {
    const el = document.createElement("pre")
    el.style.color = err.severe ? "#ff8383" : "#f9e2af"
    el.textContent = `line ${err.line+1}: ${err.message}\n${err.hints}`
    diag.appendChild(el)
  })
})
navigation.addEventListener("navigate", async (event) => {
  const url = new URL(event.destination.url)
  const filename = new URLSearchParams(url.search).get("root")
  if (filename) {
    event.preventDefault()
    event.stopPropagation()
  }
  if (filename.startsWith("/")) {
    main = filename
  } else {
    main = "/" + filename
  }
  run()
})

async function readDir(dir, path = []) {
  for await (let entry of dir.values()) {
    if (entry.kind === "directory") {
      await readDir(entry, [...path, entry.name])
      continue
    }

    await readFile(entry, path)
  }
}

async function readFile(entry, path) {
  if (entry.name === "dyno.typ") {
    isEmpty = false
  }

  const name = "/" + [...path, entry.name].join("/")
  const method = name == main ? "setMain" : "write"
  const bytes = new Uint8Array(await entry.getFile().then(f => f.arrayBuffer()))
  engine.contentWindow.postMessage({method, name, bytes})

  if (name.endsWith(".ttf") || name.endsWith(".otf")) {
    engine.contentWindow.postMessage({
      method: "font",
      name: entry.name.split(".")[0],
      bytes,
    })
  }
}

async function downloadTemplate() {
  const promises = DYNO.map(async (pathStr) => {
    const path = pathStr.split("/")
    let handle = dir
    for (const seg of path.slice(0, -1)) {
      handle = await handle.getDirectoryHandle(seg, { create: true })
    }
    handle = await handle.getFileHandle(path.at(-1), { create: true })
    const wr = await handle.createWritable()
    const res = await fetch("/" + pathStr)
    await wr.write(await res.arrayBuffer())
    await wr.close()
  })

  const handle = await dir.getFileHandle(main.replace("/", ""), { create: true })
  const wr = await handle.createWritable()
  const res = await fetch("/default.typ")
  await wr.write(await res.arrayBuffer())
  await wr.close()

  await readDir(dir)
}
```.text)

