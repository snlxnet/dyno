const SAMPLE_FILE = `#import "@preview/dyno:0.1.0": *
// #import "@preview/yap:0.1.0": *

#let number = 0
Number: #input(number)
  #input(number)
`
main()

async function initLsp() {
  let mist;
  let tm;
  await import("/tinymist/pkg/tinymist.js")
    .then((pkg) => (mist = pkg))
    .then(() => mist.default())

  tm = new mist.TinymistLanguageServer({
    sendEvent: (event) => console.log({ event, source: "Tinymist" }),
    sendRequest: (request) => console.log({ request, source: "Tinymist" }),
    sendNotification: (notification) => {
      if (notification.method === "tmLog") {
        console.log(notification.params.data);
        return;
      } else if (notification.method === "textDocument/publishDiagnostics") {
        console.warn(notification.params.diagnostics)
        return
      }
      console.log({ notification, source: "Tinymist" });
    },
    resolveFn: (resolver) => console.log({ resolver, source: "Tinymist" }),
  });
  const response = tm.on_request("initialize", {
    processId: null,
    rootUri: "file:///main.typ",
    capabilities: {
      workspace: {
        fileOperations: { didCreate: true },
        diagnostics: { refreshSupport: true },
        executeCommand: { dynamicRegistration: true },
        references: { dynamicRegistration: true },
      },
      textDocument: {
        publishDiagnostics: {
          dataSupport: true,
          versionSupport: false,
        },
        diagnostic: { relatedInformation: true, dataSupport: true },
      },
    },
  });
  console.log(response.capabilities)
  tm.on_notification("initialized", {});
  return tm
}

async function main() {
  const lines = SAMPLE_FILE.split("\n")

  const dynoImportIdx = lines.findIndex(line => line.includes('"@preview/dyno'))
  lines[dynoImportIdx] = "#let input(..args) = []"

  const lsp = await initLsp()
  const uri = "file:///main.typ"
  lsp.on_notification("textDocument/didOpen", {
    textDocument: {
      languageId: "typst",
      text: lines.join("\n"),
      uri,
      version: 1,
    }
  })

  const inputs = await getInputs(lsp, lines)

  console.log(inputs)
}

/**
@param {any} lsp
@param {string[]} lines
@returns {Promise<{line: number, character: number}[]>}
*/
async function getInputs(lsp, lines) {
  const maybeInputs = await Promise.all(lines
    .flatMap((line, idx) => line.matchAll("input").map(match => ({line: idx, character: match.index})).toArray())
    .map(async ({line, character}) => ({
      source: {line, character},
      target: await definition(lsp, line, character),
    }))
  )

  const duplicateInputs = maybeInputs
    .filter(it => it.target !== null)
    .map(({source}) => source)

  return Array.from(new Set(duplicateInputs.map(JSON.stringify))).map(JSON.parse)
}

/**
@param {any} lsp
@param {number} line
@param {number} character
@returns {Promise<{line: number, character: number} | null>}
*/
async function definition(lsp, line, character) {
  const response = await lsp.on_request("textDocument/definition", {
    textDocument: { uri: "file:///main.typ" },
    position: { line, character }
  })

  return response.at(0)?.targetRange?.end || null
}
