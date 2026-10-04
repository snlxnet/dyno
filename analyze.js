async function initLsp() {
  let mist;
  let tm;
  const isNode = typeof window === "undefined"

  await import(isNode ? "./node-lsp.js" : "/tinymist/pkg/tinymist.js")
    .then((pkg) => (mist = pkg))
    .then(() => mist.default())

  const nop = () => {}
  tm = new mist.TinymistLanguageServer({ sendEvent: nop, sendRequest: nop, sendNotification: nop, resolveFn: nop });
  tm.on_request("initialize", {
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
  tm.on_notification("initialized", {});
  return tm
}

/**
@param {string} text 
*/
export async function analyze(text) {
  const lines = text.split("\n")

  const dynoImportIdx = lines.findIndex(line => line.includes('"@local/dyno'))
  const initialDynoImport = lines[dynoImportIdx]
  lines[dynoImportIdx] = "#let input(..args) = []; #let swap(..args) = []"

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

  const inputMap = await analyzeInputs(lsp, lines)
  const swapMap = await analyzeSwaps(lsp, lines)
  await lsp.free()

  lines[dynoImportIdx] = initialDynoImport

  return {
    map: [
      ...inputMap,
      ...swapMap,
    ],
    text: lines.join("\n")
  }
}

/**
@param {any} lsp
@param {string[]} lines GETS MUTATED
*/
async function analyzeInputs(lsp, lines) {
  const inputs = await getTypstFn(lsp, lines, "input")

  const variables = await getInputVariables(lsp, inputs)

  const map = variables.map(async ({input, variable}) => {
    const id = variable.end.line + ":" + variable.end.character

    const line = lines[input.line]
    const start = line.slice(0, input.character + 1)
    const end = line.slice(input.character + 1)
    lines[input.line] = start + 'id: "' + id + '", ' + end

    const valueString = lines[variable.end.line].slice(variable.end.character).replace(/\s*=\s/, "")
    const value = JSON.parse(valueString)
    const options = await getOptions(lsp, lines, variable)

    return {
      kind: "input",
      id,
      value,
      options: options.length ? options : undefined,
      pos: variable.end,
      input,
    }
  })

  return Promise.all(map)
}

/**
@param {any} lsp
@param {string[]} lines GETS MUTATED
*/
async function analyzeSwaps(lsp, lines) {
  const swapButtons = await getTypstFn(lsp, lines, "swap")

  const variables = await getSwapVariables(lsp, swapButtons, lines)

  return variables.map(v => {
    const id = `sw-${v.a.end.line}:${v.a.end.character}-${v.b.end.line}:${v.b.end.character}`

    const line = lines[v.swap.line]
    const start = line.slice(0, v.swap.character + 1)
    const end = line.slice(v.swap.character + 1)
    lines[v.swap.line] = start + 'id: "' + id + '", ' + end

    return {
      ...v,
      id,
      kind: "swap",
    }
  })
}

/**
@param {any} lsp
@param {string[]} lines
@param {string} fn the desired typst function (input, swap, url)
@returns {Promise<{line: number, character: number}[]>}
*/
async function getTypstFn(lsp, lines, fn) {
  const maybeInputs = await Promise.all(lines
    .flatMap((line, idx) => line.matchAll(fn).map(match => ({line: idx, character: match.index})).toArray())
    .map(({line, character}) => selectVariable(lsp, line, character))
  )

  const duplicateInputs = maybeInputs
    .filter(it => it !== null)

  return Array.from(new Set(duplicateInputs.map(JSON.stringify))).map(JSON.parse)
}

/**
@param {any} lsp
@param {any} inputs
@returns {Promise<{input: {line: number, character: number}, variable: {start: {line: number, character: number}, end: {line: number, character: number}}}[]>}
*/
async function getInputVariables(lsp, inputs) {
  const maybeVariables = await Promise.all(inputs.map(async (input) => ({
    variable: await definition(lsp, input.line, input.character + 2),
    input,
  })))

  return maybeVariables.filter(it => it.variable !== null)
}

/**
@param {any} lsp
@param {any} swapButtons
@param {string[]} lines
@returns {Promise<{swap: {line: number, character: number}, a: {start: {line: number, character: number}, end: {line: number, character: number}}, b: {start: {line: number, character: number}, end: {line: number, character: number}}}[]>}
*/
async function getSwapVariables(lsp, swapButtons, lines) {
  const maybeVariables = await Promise.all(swapButtons.map(async (swap) => ({
    a: await definition(lsp, swap.line, swap.character + 2),
    b: await definition(lsp, swap.line, lines[swap.line].slice(swap.character).match(/\)/).index+swap.character - 1),
    swap,
  })))

  return maybeVariables.filter(it => it.swap !== null && it.a && it.b)
}

/**
@param {any} lsp
@param {string[]} lines
@param {{start: {line: number, character: number}, end: {line: number, character: number}}} variable
@returns {Promise<string[]>}
*/
async function getOptions(lsp, lines, variable) {
  const name = lines[variable.start.line].slice(variable.start.character, variable.end.character)

  const maybeMentions = await Promise.all(lines
    .flatMap((line, idx) => line.matchAll(name).map(match => ({line: idx, character: match.index})).toArray())
    .map(({line, character}) => selectVariable(lsp, line, character))
  )
  const mentions = maybeMentions
    .filter(it => it !== null)
    .filter(({ line, character }) => lines[line].slice(character).trim().startsWith("=="))

  return mentions.map(({line, character}) => lines[line].slice(character).replace(/\s*==\s"*/, "").split('"', 1)[0])
}

/**
@param {any} lsp
@param {number} line
@param {number} character
@returns {Promise<{start: {line: number, character: number}, end: {line: number, character: number}} | null>}
*/
async function definition(lsp, line, character) {
  const response = await lsp.on_request("textDocument/definition", {
    textDocument: { uri: "file:///main.typ" },
    position: { line, character }
  })

  return response?.at(0)?.targetRange || null
}

/**
@param {any} lsp
@param {number} line
@param {number} character
@returns {Promise<{line: number, character: number} | null>}
*/
async function selectVariable(lsp, line, character) {
  const response = await lsp.on_request("textDocument/definition", {
    textDocument: { uri: "file:///main.typ" },
    position: { line, character }
  })

  return response?.at(0)?.originSelectionRange?.end || null
}

