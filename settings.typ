#import "dyno.typ": input, swap, input-theme

#set text(font: "Comfortaa", fill: rgb("#ccc"))
#set page(fill: rgb("#2e2d39"), height: auto)
#set align(horizon)

#let width = "auto"
#let height = "auto"
#let width-swp = "auto"
#let height-swp = "auto"
#let baseline = "0pt"

#let inset = "2mm"
#let outset = "0mm"
#let radius = "0mm"

#let fill = "rgb(\"#12312300\")"
#let fill-focused = "rgb(\"#12312300\")"
#let fill-selected = "rgb(\"#12312300\")"

#let stroke = "1pt + black"
#let stroke-focused = "1pt + green"
#let stroke-selected = "1pt + gray"

#let text = "luma(0%)"
#let text-focused = "luma(0%)"
#let text-selected = "luma(50%)"

#let content-checked = "[#sym.checkmark]"
#let content-unchecked= "[#sym.crossmark]"
#let content-swp= "[#sym.arrow.l.r]"

#input-theme.update((default) => (
  width: eval(width),
  height: eval(height),
  width-swap: eval(width-swp),
  height-swap: eval(height-swp),
  baseline: eval(baseline),

  inset: eval(inset),
  outset: eval(outset),
  radius: eval(radius),

  fill: eval(fill),
  fill-focused: eval(fill-focused),
  fill-selected: eval(fill-selected),

  stroke: eval(stroke),
  stroke-focused: eval(stroke-focused),
  stroke-selected: eval(stroke-selected),

  text: eval(text),
  text-focused: eval(text-focused),
  text-selected: eval(text-selected),

  content-checked: eval(content-checked),
  content-unchecked: eval(content-unchecked),
  content-swap: eval(content-swp),
))

#link("/")[#sym.arrow.l Back]

#columns[
= Settings
#table(
  columns: 2,
  stroke: none,

  "width", input(width),
  "height", input(height),

  "width-swap", input(width-swp),
  "", swap(width-swp, height-swp),
  "height-swap", input(height-swp),

  "baseline", input(baseline),

  "inset", input(inset),
  "outset", input(outset),
  "radius", input(radius),

  "fill", input(fill),
  "fill-focused", input(fill-focused),
  "fill-selected", input(fill-selected),

  "stroke", input(stroke),
  "stroke-focused", input(stroke-focused),
  "stroke-selected", input(stroke-selected),

  "text", input(text),
  "text-focused", input(text-focused),
  "text-selected", input(text-selected),

  "content-checked", input(content-checked),
  "content-unchecked", input(content-unchecked),
  "content-swap", input(content-swp),
)

#colbreak()

= Demo
#let a = 10
#let b = "one"
#let c = false

#if b == "one" {} else if b == "two" {}

#input(a)
#input(b)
#input(c)
]
