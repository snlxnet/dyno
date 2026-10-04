#let input-theme = state(
  "input-theme",
  (
    width: auto,
    height: auto,
    width-swap: auto,
    height-swap: auto,
    baseline: 0pt,

    inset: 2mm,
    outset: 0mm,
    radius: 0mm,

    fill: rgb("#12312300"),
    fill-focused: rgb("#12312300"),
    fill-selected: rgb("#12312300"),

    stroke: 1pt + black,
    stroke-focused: 1pt + green,
    stroke-selected: 1pt + gray,

    text: luma(0%),
    text-focused: luma(0%),
    text-selected: luma(50%),

    content-checked: [on],
    content-unchecked: [off],
    content-swap: [#sym.arrow.l.r],
  ),
)

#let input(
  body,
  id: "noid",
  state: 0,
) = context {
  let theme = input-theme.get()

  let (text-color, stroke, fill) = if state == 0 {
    (theme.text, theme.stroke, theme.fill)
  } else if state == 2 {
    (theme.text-selected, theme.stroke-selected, theme.fill-selected)
  } else {
    (theme.text-focused, theme.stroke-focused, theme.fill-focused)
  }

  let point = if state == 3 [.] else []

  let val = if type(body) == bool {
    if body { theme.content-checked } else { theme.content-unchecked }
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

  [#box(
    width: theme.width,
    baseline: theme.baseline,
    inset: inset,
    outset: theme.outset,
    radius: theme.radius,
    stroke: stroke,
    fill: fill,
    text(fill: text-color, val),
  )#label(lbl)]
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

  [#box(
    width: theme.width-swap,
    height: theme.height-swap,
    baseline: theme.baseline,
    inset: theme.inset,
    outset: theme.outset,
    radius: theme.radius,
    stroke: stroke,
    fill: fill,
    theme.content-swap,
  )#label(id + ";")]
}
