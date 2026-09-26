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
        console.warn(...notification.params.diagnostics)
        return
      }
      console.log({ notification, source: "Tinymist" });
    },
    resolveFn: ({namespace, name, version}) => {
      if (namespace !== "preview") {
        console.error("dyno: can't load package " + name)
        return
      }

      if (name === "dyno") {
        console.error("TODO")
        return
      }

      console.log({name})
      return '/pkg/' + name
    },
  });
  const init = tm.on_request("initialize", {
    processId: null,
    rootUri: "file:///project/main.typ",
    capabilities: {
      workspace: {
        fileOperations: { didCreate: true },
        diagnostics: { refreshSupport: true },
        executeCommand: { dynamicRegistration: true },
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
  console.log({init})
  tm.on_notification("initialized", {});
  return tm
}

async function main() {
  const tinymist = await initLsp()

  tinymist.on_notification("textDocument/didOpen", {
    textDocument: {
      languageId: "typst",
      text: `[package]
name = "yap"
version = "0.1.0"
keywords = ["video", "presentation", "html"]
categories = ["components", "visualization", "integration"]
entrypoint = "lib.typ"
authors = ["<@snlxnet>"]
homepage = "https://yap.snlx.net"
repository = "https://github.com/snlxnet/yap"
license = "MIT"
description = "Add videos & speaker notes to paged documents."`,
      uri: "file:///pkg/yap/typst.toml",
      version: 1,
    }
  })

  tinymist.on_notification("textDocument/didOpen", {
    textDocument: {
      languageId: "typst",
      text: `#let works = true`,
      uri: "file:///pkg/yap/lib.typ",
      version: 1,
    }
  })

  tinymist.on_notification("textDocument/didOpen", {
    textDocument: {
      languageId: "typst",
      text: `#import "@preview/idk:0.1.0": works\n#works`,
      uri: "file:///project/main.typ",
      version: 1,
    }
  })
}
