#import "@preview/cades:0.3.1": qr-code
#set page(paper: "a6", flipped: true)

#let k = 7
#let qr(path, background: white, color: black, width: 50mm, radius: 1em) = box(width: width, radius: radius, clip: true, align(
  center + horizon,
  stack(
    box(
      fill: background,
      inset: width/k,
      width: 100%,
      qr-code(
        "https://snlx.net" + path,
        background: background,
        color: color,
      ),
    ),
    v(1mm),
    box(fill: background, width: 100%, inset: (x: width/k, y: width/k/2))[
      #set text(fill: color)
      #link("https://snlx.net" + path, box(width: 40%, align(right, underline("EN"))))
      \/
      #link("https://ru.snlx.net" + path, box(width: 40%, align(left, underline("RU"))))
    ]
  ),
))

#grid(
  columns: (auto,)*3,
  gutter: 3em,
  qr("/", width: 40mm, background: rgb("#eee"), color: rgb("#444")),
  qr("/", width: 40mm, background: rgb("#121212"), color: rgb("#eee")),
  qr("/", width: 40mm, background: rgb("#c9c1ba"), color: rgb("5a4741")),
)
