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

  const references = await lsp.on_request("textDocument/references", {
    context: { includeDeclaration: true },
    textDocument: { uri },
    position: {
      line: dynoImportIdx,
      character: 5,
    }
  })

  console.log({text: lines.join("\n"), references, dynoImportIdx})
}
