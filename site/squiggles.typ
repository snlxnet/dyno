#import "@preview/suiji:0.5.1": gen-rng, integers

#let wrap(fn) = context if target() == "html" {
  html.div(
    class: "squiggles",
    html.frame(
      box(
        height: 10mm,
        fn((width: 2000mm))
      )
    )
  )
} else {
  layout(fn)
}

#let squiggles(
  seed,
  spikes: false,
  amplitude: 8,
  segment: 20,
  down: 5,
  up: 0,
  fill: luma(90%),
  stroke: none,
) = wrap(size => {
  let rng = gen-rng(seed)
  let n = 0

  let segments = calc.ceil(size.width / (2mm * segment)) + 1
  let points = ()
  let end = 1mm * (segments * segment * 2)

  for i in range(segments * 2 + 1) {
    (rng, n) = integers(rng, low: 0, high: segment)
    let x = n * 1mm
    (rng, n) = integers(rng, low: 0, high: amplitude)
    let y = (down+n) * 1mm

    points.push((segment*1mm*i+x, y))
  }
  points.push((end, 0mm))

  align(
    center,
    curve(
      fill: fill,
      stroke: stroke,
      curve.move((0mm, -up*1mm)),
      curve.line((0mm, 0mm)),
      ..points.chunks(2).map((chunk) => curve.cubic(auto, ..if spikes {(none, chunk.at(1))} else {chunk})),
      curve.line((end, 0mm)),
      curve.line((end, -up*1mm)),
    ),
  )
})

#set page(margin: 10mm, paper: "a6", flipped: true)
#set box(outset: 3mm)
#set text(font: "JetBrains Mono")

#set page(fill: rgb("#eee"))
#let fill = rgb("#fff")
#set text(fill: rgb("#000"))
#show strong: set text(fill: rgb("#6c7"))
#box(fill: fill, width: 100%, outset: 10mm)[
  Smooth / light, *bold*.
]
#squiggles(0, segment: 30, amplitude: 10, down: 3, fill: fill, stroke: 0.3mm + rgb("#aaa"))
= Heading
#set text(fill: rgb("#444"))
Colors: custom.

#set page(fill: rgb("#121212"))
#let fill = rgb("#2e2d39")
#set text(fill: rgb("#eee"))
#show strong: set text(fill: rgb("#a8a5ff"))
#box(fill: fill, width: 100%, outset: 10mm)[
  Smooth / dark, *bold*.
]
#squiggles(1, segment: 20, amplitude: 6, fill: fill, stroke: 0.3mm + rgb("#556"), down: 8)
= Heading
#set text(fill: rgb("#ccc"))
Colors: excalidraw.

#set page(fill: rgb("#321"))
#set text(fill: rgb("#eee"))
#let fill = rgb("#543")
#show strong: set text(fill: rgb("#cba"))
#box(fill: fill, width: 100%, outset: 10mm)[
  Spiky, *bold*.
]
#squiggles(2, spikes: true, segment: 7, fill: fill, stroke: 0.8mm + rgb("#111"), down: 5)
= Heading
#set text(fill: rgb("#ccc"))
Colors: TBD
