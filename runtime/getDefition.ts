import { type Position, type Range, type Slice } from "./common.ts";
import { type LSP } from "./lsp.ts";

type LocationLink = {
  targetUri: string;
  targetRange: Range;
};

export async function getValueDefinition({
  fileUri,
  fileBody,
  lsp,
  target,
}: {
  fileUri: URL;
  fileBody: string;
  lsp: LSP;
  target: Position;
}) {
  lsp.request("textDocument/definition", {
    textDocument: { uri: fileUri },
    position: target,
  });
  return new Promise((resolve: (where: Slice) => void, reject: () => void) => {
    function handler(message: any) {
      if (!message.result) {
        reject()
      }

      if (!isDefinition(message)) {
        return;
      }

      const definition = (message.result as LocationLink[])[0];

      if (!definition || definition.targetUri !== fileUri.toString()) {
        return;
      }

      lsp.unsubscribe(handler)

      resolve(getValue(definition.targetRange, fileBody));
    }

    lsp.subscribe(handler);
  });
}

function isDefinition(message: any) {
  return Array.isArray(message.result);
}

function getValue(variable: Range, fileBody: string): Slice {
  const startIdx =
    fileBody.split("\n").slice(0, variable.end.line).join("\n").length +
    variable.end.character;
  const linesAfterDef = fileBody.split("\n").slice(variable.end.line);

  const endOnNewline = !"({[".includes(linesAfterDef[0].trim().at(-1)!);

  let bracketDepth = -1;
  let weCare = false;
  let endIdx = 0;
  let firstEqualSign = Infinity;

  fileBody.split("").forEach((char, idx) => {
    if (idx === startIdx) weCare = true;
    if (!weCare) return;

    if (char === "=" && idx < firstEqualSign) firstEqualSign = idx;

    if (char === "\n" && endOnNewline) {
      weCare = false;
      endIdx = idx;
    }

    if ("({[".includes(char)) {
      if (bracketDepth === -1) bracketDepth = 0;
      bracketDepth++;
    }
    if ("]})".includes(char)) bracketDepth--;

    if (bracketDepth === 0) {
      weCare = false;
      endIdx = idx + 1;
    }
  });

  return [firstEqualSign + 1, endIdx];
}
