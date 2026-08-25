#let theme = state("dyno-theme", (body) => body)
#let set-theme(function) = context theme.update((_old) => function)

#let input(
  body,
  name: "",
  options: (),
  on: [checkbox-on],
  off: [checkbox-off],
  ..args
) = context (theme.get())(body, {
  let bodyType = type(body)

  let val = if options.len() > 0 {
    options.at(body)
  } else if bodyType == bool {
    if body { on } else { off }
  } else [#body]

  let props = ()

  [#box(val)#label(json.encode(props))]
})

