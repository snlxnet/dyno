import { spawn } from "child_process";
import { readFile } from "fs/promises";
import { resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";

export type LSP = {
  request<T extends object | any[]>(method: string, params?: T): Promise<void>;
  notify<T extends object | any[]>(method: string, params?: T): void;
  subscribe(handler: (message: any) => any): void;
  exit(): void;
  fileUri: URL;
  filePath: string;
  initialFileBody: string;
};

export async function buildLSP(cwd: string, filename: string): Promise<LSP> {
  const fileUri = pathToFileURL(resolve(cwd, filename))

  const lspServer = spawn("tinymist", ["lsp", "--ignore-system-fonts"], {
    env: { ...process.env, TYPST_FONT_PATHS: cwd, cwd },
  });
  const decoder = new TextDecoder();

  let contentLength = 0;
  let buffer = "";

  const subscribers: Set<(message: any) => any> = new Set();

  let resolveFunction: () => void = () => {};

  lspServer.stdout.on("data", (chunk) => {
    const response = decoder.decode(chunk);
    const [headers, _, body] = response.split("\n");
    const contentLengthHeader = headers
      .split("\n")
      .find((line) => line.startsWith("Content-Length: "));

    if (contentLengthHeader) {
      contentLength = +contentLengthHeader.split(":")[1];
      if (body.length === contentLength) {
        const data = JSON.parse(body) as object;
        resolveFunction();
        subscribers.forEach((sub) => sub(data));
        resolveFunction = () => {};
        return;
      }
      buffer = body;
    }

    buffer += response;
    try {
      const data = JSON.parse(buffer);
      resolveFunction();
      subscribers.forEach((sub) => sub(data));
      resolveFunction = () => {};
      buffer = "";
    } catch {
      // waiting, nothing to catch
    }
  });

  async function send(data: object) {
    const body = JSON.stringify(data);
    const request = `Content-Length: ${body.length}\r\n\r\n${body}`;
    lspServer.stdin.write(request);

    return new Promise<void>((resolve) => {
      resolveFunction = resolve;
    });
  }

  let id = 1;
  async function request(method: string, params?: any) {
    return send({
      jsonrpc: "2.0",
      id: id++,
      method,
      params,
    });
  }
  function notify(method: string, params?: any) {
    send({ jsonrpc: "2.0", method, params });
  }

  const filePath = fileURLToPath(fileUri);
  const fileBody = await readFile(filePath, { encoding: "utf-8" });

  async function init() {
    const initParams = {
      processId: null,
      rootUri: "file://" + cwd,
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
    };

    await request("initialize", initParams);

    notify("initialized");

    notify("textDocument/didOpen", {
      textDocument: {
        languageId: "typst",
        text: fileBody,
        uri: fileUri.toString(),
        version: 1,
      },
    });
  }

  await init();

  return {
    request,
    notify,
    subscribe(handler) {
      subscribers.add(handler);
    },
    fileUri,
    filePath,
    initialFileBody: fileBody,
    exit() {
      lspServer.kill();
    },
  };
}
