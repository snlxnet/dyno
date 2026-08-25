#let theme = state("dyno-theme", (body) => body)
#let set-theme(function) = context theme.update((_old) => function)

#let input(
  body,
  uuid: "input", // no uuids for the normal compiler
  on: [checkbox-on],
  off: [checkbox-off],
  ..args
) = context (theme.get())(body, {
  let bodyType = type(body)

  let val = if bodyType == bool {
    if body { on } else { off }
  } else [#body]

  [#box(val)#label(uuid)]
})

