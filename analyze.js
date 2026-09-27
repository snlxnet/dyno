const SAMPLE_FILE = `#import "@preview/dyno:0.1.0": *
#import "@preview/yap:0.1.0": *

#let number = 0
#let checkbox = true
#let string = "hello"
#let sel = "first"

#let sel-num = if sel == "first" { 1 } else if sel == "second" { 2
} else if sel == "third" { 3 }

Number: #input(number) \
Check: #input(checkbox) \
String: #input(string) \

Select: #input(sel) \
Selected: sel-num
`

analyze(SAMPLE_FILE).then(console.log)

async function initLsp() {
  let mist;
  let tm;
  await import("/tinymist/pkg/tinymist.js")
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

  const variables = await getVariables(lsp, inputs)

  const map = variables.map(async ({input, variable}) => {
    const id = variable.end.line + ":" + variable.end.character

    const line = lines[input.line]
    const start = line.slice(0, input.character + 2)
    const end = line.slice(input.character + 2)
    lines[input.line] = start + 'id: "' + id + '", ' + end

    const value = lines[variable.end.line].slice(variable.end.character).replace(/\s*=\s/, "")
    const options = await getOptions(lsp, lines, variable)

    return options.length ? { id, value, options, pos: variable.end } : { id, value, pos: variable.end }
  })

  const result = await Promise.all(map)
  await lsp.free()

  return result
}

/**
@param {any} lsp
@param {string[]} lines
@returns {Promise<{line: number, character: number}[]>}
*/
async function getInputs(lsp, lines) {
  const maybeInputs = await Promise.all(lines
    .flatMap((line, idx) => line.matchAll("input").map(match => ({line: idx, character: match.index})).toArray())
    .map(({line, character}) => selectVariable(lsp, line, character))
  )

  const duplicateInputs = maybeInputs
    .filter(it => it !== null)

  return Array.from(new Set(duplicateInputs.map(JSON.stringify))).map(JSON.parse)
}

/**
@param {any} lsp
@param {string[]} lines
@returns {Promise<{input: {line: number, character: number}, variable: {start: {line: number, character: number}, end: {line: number, character: number}}}[]>}
*/
async function getVariables(lsp, inputs) {
  const maybeVariables = await Promise.all(inputs.map(async (input) => ({
    variable: await definition(lsp, input.line, input.character + 2),
    input,
  })))

  return maybeVariables.filter(it => it.variable !== null)
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

