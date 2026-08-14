#import "@preview/dyno:0.1.0": input, set-theme
#set-theme((value, input) => {
  set box(stroke: blue, inset: 2mm, radius: 1mm)
  set text(fill: blue)
  show "checkbox-on": sym.checkmark
  show "checkbox-off": sym.crossmark

  input
})

= Dyno

#let number = 42
#let text = "string"
#let checkbox = false
#let toggle = false
#let select-value = 0
#let select-options = ("zero", "one", "two")

Render input:
- #input(number)
- #{input(text)}
- #input(checkbox)
- #input(on: [Enabled], toggle, off: [D,isabled])
- #input(select-value, options: select-options)

Fake call: input(number)

#let number = 0
Other more different number: #input(number)
