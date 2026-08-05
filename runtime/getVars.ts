import { type LSP } from "./lsp.ts";
import type { Location, Position, Range, Slice } from "./common.ts";

const INPUT_FUNCTION_LINE = 3;
const INPUT_FUNCTION_CHARACTER = 6;

export async function getVars({
  fileBody,
  libUri,
  lsp,
}: {
  fileBody: string;
  libUri: URL;
  lsp: LSP;
}) {
  lsp.request("textDocument/references", {
    context: { includeDeclaration: true },
    textDocument: { uri: libUri.toString() },
    position: {
      line: INPUT_FUNCTION_LINE,
      character: INPUT_FUNCTION_CHARACTER,
    },
  });

  return new Promise(
    (
      resolve: (
        data: { range: Range; variable: string; slice: Slice }[],
      ) => any,
    ) => {
      lsp.subscribe((message) => {
        if (!isReferences(message)) {
          return;
        }

        const references = (message.result as Location[])
          .filter((ref) => ref.uri === lsp.fileUri.toString())
          .map((ref) => ref.range);

        const result = processReferences(references, fileBody);

        resolve(result);
      });
    },
  );
}

function isReferences(message: any) {
  return (
    Array.isArray(message?.result) &&
    message.result[0]?.range &&
    message.result[0]?.uri
  );
}

function processReferences(references: Range[], fileBody: string) {
  const triggers = fileBody
    .split("\n")
    .map((line, idx) => {
      const ref = references.find((ref) => ref.end.line === idx);

      if (!ref) {
        return null;
      }

      const nextChar = line.at(ref.end.character);
      if (nextChar !== "(") {
        return null;
      }

      return ref.end;
    })
    .filter((pos) => pos !== null);

  let x = 0;
  let y = 0;
  let bracketDepth = 0;
  let weCare = false;

  let starts: { pos: Position; idx: number }[] = [];
  let ends: { pos: Position; idx: number }[] = [];

  fileBody.split("").forEach((char, idx) => {
    if (char === "\n") {
      x = 0;
      y++;
      return;
    }

    if (triggers.find((pos) => pos.character === x && pos.line === y)) {
      bracketDepth = 0;
      weCare = true;
      starts.push({
        idx: idx + 1,
        pos: {
          line: y,
          character: x + 1,
        },
      });
    }

    if (char === "(") bracketDepth++;
    if (char === ")") bracketDepth--;

    if (bracketDepth === 0 && weCare) {
      ends.push({
        idx,
        pos: {
          line: y,
          character: x,
        },
      });
      weCare = false;
    }

    x++;
  });

  const variables: { range: Range; variable: string; slice: Slice }[] =
    starts.map((start, idx) => {
      const end = ends[idx];

      const text = fileBody.slice(start.idx, end.idx);
      const args = text.split(",").map((slice) => slice + ",");

      const variableArg = args.findIndex((arg) => !arg.includes(":"));
      const variableName = args[variableArg].replace(/[\s,]+/g, "");
      const lenBefore = args.slice(0, variableArg).join("");
      const whitespace = args[variableArg].match(/^\s+/)?.[0] || "";

      const lineOffset = (lenBefore + whitespace).match(/\n/g)?.length || 0;
      const characterOffset =
        (lenBefore + whitespace).split("\n").at(-1)?.length || 0;

      const range = {
        start: {
          line: start.pos.line + lineOffset,
          character: start.pos.character + characterOffset,
        },
        end: {
          line: start.pos.line + lineOffset,
          character: start.pos.character + args[variableArg].length - 1,
        },
      };

      return { range, variable: variableName, slice: [start.idx, end.idx] };
    });

  return variables;
}
