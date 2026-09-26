const tinymist = initLsp()

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
      }
      console.log({ notification, source: "Tinymist" });
    },
    resolveFn: (resolver) => console.log({ resolver, source: "Tinymist" }),
  });
  tm.on_request("initialize", {
    processId: null,
    rootUri: "file:///main.typ",
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
  tm.on_notification("initialized", {});
  return tm
}
