#let input-theme = state(
  "input-theme",
  (
    width: auto,
    height: auto,
    baseline: auto,

    inset: 2mm,
    radius: 0mm,

    fill: rgb("#12312300"),
    fill-focused: rgb("#12312300"),
    fill-selected: rgb("#12312300"),

    stroke: 1pt + black,
    stroke-focused: 1pt + green,
    stroke-selected: 1pt + gray,

    text: none, // inherit
    text-focused: none, // inherit
    text-selected: gray,

    content-checked: [onn],
    content-unchecked: [of],
    content-swap: [swap],
  ),
)

#let input(
  body,
  id: "noid",
  state: 0,
) = context {
  let theme = input-theme.get()

  let (stroke, fill) = if state == 0 {
    (theme.stroke, theme.fill)
  } else if state == 2 {
    (theme.stroke-selected, theme.fill-selected)
  } else {
    (theme.stroke-focused, theme.fill-focused)
  }

  let point = if state == 3 [.] else []

  let val = if type(body) == bool {
    if body [ on ] else [ off ]
  } else [#body#point]

  let data = json.encode((id: id, size: text.size), pretty: false)
  let flexify(align) = {
    if align == start or align == top or align == left {
      "flex-start"
    } else if align == end or align == bottom or align == right {
      "flex-end"
    } else {
      "center"
    }
  }

  let tracking = json.encode(text.tracking).slice(1, -1)
  let text-align = json.encode(align.alignment.x).slice(1, -1) + ";" + flexify(align.alignment.y)
  let inset = theme.inset
  let inset-string = json.encode(inset * 0.75).slice(1, -1)
  let lbl = id + ";" + str(text.size.pt()) + ";" + text.font + ";" + tracking + ";" + text.fill.to-hex() + ";" + text-align + ";" + inset-string

  [#box(baseline: theme.baseline, inset: inset, stroke: stroke, fill: fill, val)#label(lbl)]
}

#let swap(
  ..args,
  id: "noid",
  state: 0,
) = context {
  let theme = input-theme.get()

  let (stroke, fill) = if state == 0 {
    (theme.stroke, theme.fill)
  } else if state == 2 {
    (theme.stroke-selected, theme.fill-selected)
  } else {
    (theme.stroke-focused, theme.fill-focused)
  }

  [#box(baseline: theme.baseline, inset: theme.inset, stroke: stroke, fill: fill, [swap])#label(id + ";")]
}
