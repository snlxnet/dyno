#import "dyno.typ": input, swap, input-theme, url
#import "tabs.typ": tabs

#set page(height: auto, margin: 2em)

#let answer(expr) = str(expr)
#let accent = green
#let neutral = rgb("#ddd")
#let border = neutral + 0.3mm

#set text(14pt, font: "Departure Mono")

#context input-theme.update((default) => (
    ..default,
    inset: 0.6em,
    baseline: 0.6em,
    radius: 0.3em,
    stroke: 0.3mm + neutral,
    stroke-focused: 0.3mm + accent,
    stroke-selected: 0.3mm + accent,
))


#let sticker-h = 20
#let sticker-w = 30
#let roll-w = 1200
#let count = 20
#let margin = 6
#let checkbox = false
#let select = "zero"

#let columns = calc.floor(roll-w / (sticker-w+margin))
#let rows = calc.ceil(count / columns)
#let roll-length = rows * (sticker-h+margin) + 200

#tabs[наклейки]
#grid(
  columns: 2,
  gutter: 2em,
  [Размеры наклейки, мм], grid(
    columns: 3,
    gutter: 1em,
    input(sticker-w),
    swap(sticker-w, sticker-h),
    input(sticker-h),
  ),
  [Ширина рулона, м], input(roll-w),
  [Количество наклеек], input(count),
  [Длина рулона, м/п], answer(roll-length/1000),
  [Галочка], input(checkbox),
)

Select field:
#input(select)

Value: #if select == "zero" {
  0
} else if select == "one" {
  1
} else if select == "two" {
  2
} else if select == "three" {
  3
}

#colbreak()

#layout(size => {
  let scale = size.width / roll-w
  set par(spacing: 0mm, leading: 0mm)
  box(width: roll-w*scale, height: roll-length*scale, stroke: border)[
    #set align(center + horizon)
    #for i in range(count) {
      box(width: (sticker-w+margin)*scale, height: (sticker-h+margin)*scale, inset: calc.floor(margin / 2) * scale)[
        #box(width: 100%, height: 100%, stroke: 0.25mm + accent)
      ]
    }
  ]
})

#let dino = url("https://upload.wikimedia.org/wikipedia/commons/4/49/Anchisaurus2.jpg", encoding: none)
#if dino == none [
  Loading...
] else [
  #image(dino)
]

