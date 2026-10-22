import init, { TypJs } from "/npm/typ_js.js";

export async function loadCompiler() {
  await init()
  const compiler = TypJs.new()

  const dynoSource = await fetch("/dyno.typ")
  await compiler.add("/dyno.typ", new Uint8Array(await dynoSource.arrayBuffer()))

  return compiler
}

