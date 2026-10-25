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
```.text)

#html.button(
  id: "folder",
)[Select folder]

#html.iframe(
  id: "engine",
  src: "/engine",
  style: "display: none",
)

#html.script(```js
let dir
let ready = false
let timer = null

function main() {
  if (!dir) return

  clearTimeout(timer)
  timer = setTimeout(async () => {
    engine.contentWindow.postMessage({method: "reset"})
    await readDir(dir)
    engine.contentWindow.postMessage({method: "render"})
  }, 200)
}

folder.addEventListener("click", async () => {
  dir = await window.showDirectoryPicker({ id: "dyno", mode: "readwrite" })
  engine.style.display = ""
  if (!ready) return

  new FileSystemObserver(main).observe(dir)
  main()
})
window.addEventListener("message", ({data}) => {
  console.log("msg", data)
  const { err, status } = data
  if (status === "listening") {
    ready = true
    main()
  }
  if (!err) return
  console.error(`${err.line}:${err.column} ${err.message}\nHints: ${err.hints}`)
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
  const name = "/" + [...path, entry.name].join("/")
  const method = name === "/main.typ" ? "setMain" : "write"
  const bytes = new Uint8Array(await entry.getFile().then(f => f.arrayBuffer()))
  console.log({name, bytes, method})
  engine.contentWindow.postMessage({method, name, bytes})

  if (name.endsWith(".ttf") || name.endsWith(".otf")) {
    engine.contentWindow.postMessage({
      method: "font",
      name: entry.name.split(".")[0],
      bytes,
    })
  }
}
```.text)

