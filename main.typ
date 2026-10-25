#import "dyno.typ": *
#import "site/main.typ": theme
#set raw(theme: "mocha.tmTheme")
#let purple = rgb("#a8a5ff")

#set document(
  title: "dyno | snlx.net",
  description: "A Typst runtime with inputs",
)
#set page(height: auto)
#show: theme("/dyno", "/ru/dyno", "/card.svg", "dark", 0)
#set text(size: 13pt)

#let demo(a, b) = grid(
  columns: (1fr, auto, 1fr),
  gutter: 1em,
  align: horizon,
  a,
  sym.arrow,
  b,
)

I love Typst's approachability ---
it's the easiest language to explain to a non-programmer.
It would be the perfect fit for simple apps
that need to visualize things, but it's missing inputs.
Dyno adds them:

#demo(
  [
  ```typst
  #import "dyno.typ": input

  #let answer = 42
  #input(answer)

  Double is #(answer * 2)
  ```
  ],
  box[
    #let answer = 42
    #input(answer)

    Double of that is #(answer * 2)
  ],
)

#demo(
  [
  ```typst
  #let flavor = "vanilla"
  Your fav ice cream: #input(flavor)

  You chose
  #if flavor == "vanilla" [
    #emoji.icecream.soft
  ] else if flavor == "chocolate" [
    #emoji.chocolate
  ] else if flavor == "strawberry" [
    #emoji.strawberry
  ]
  ```
  ],
  box[
    #let flavor = "vanilla"
    Your fav ice cream: #input(flavor)

    You chose
    #if flavor == "vanilla" [
      #emoji.icecream.soft
    ] else if flavor == "chocolate" [
      #emoji.chocolate
    ] else if flavor == "strawberry" [
      #emoji.strawberry
    ]
  ],
)

It also has swap buttons:
#demo(
  [
  ```typst
  #import "dyno.typ": input, swap
  #let x = 30
  #let y = 20
  #input(x)
  #swap(x, y)
  #input(y)
  #rect(width: x*1mm, height: y*1mm)
  ```
  ],
  box[
  #set rect(stroke: rgb("a8a5ff"))
  #let x = 30
  #let y = 20
  #input(x)
  #swap(x, y)
  #input(y)
  #rect(width: x*1mm, height: y*1mm, stroke: rgb("a8a5ff"))
  ]
)

Warning: the engine breaks if you put 2 inputs on one source line
like `#input(a) #input(b)`.

Dyno also allows accessing the network:
#demo(
  [
  ```typst
  5 random dinosaur species:
  #json(
    read(
      "https://dinoipsum.com/api/?format=json&paragraphs=1&words=5",
      encoding: none,
    )
  )
  ```
  ],
  box[
  5 random dinosaur species:
  #json(
    read(
      "https://dinoipsum.com/api/?format=json&paragraphs=1&words=5",
      encoding: none,
    )
  ).at(0)
  ]
)

To use it, *TODO make a js upload thingy here*

You can also self-host it, *TODO*
