#import "dyno.typ": input, swap, input-theme

#set text(font: "JetBrains Mono")
#set page(height: auto)
#show link: underline

#grid(
  gutter: 1em,
  columns: (auto,)*3,
  link("/?root=main.typ")[dyno home page],
  text(fill: purple, link("/?root=second.typ")[tab demo]),
  link("/?root=settings.typ")[settings],
)

= How to implement tabs

== The simpler way
Since tabs are just links that change the `?root` query parameter, the simplest implementation is something like:
```typst
#grid(
  gutter: 1em,
  columns: (auto,)*3,
  link("/?root=main.typ")[dyno home page],
  text(fill: purple, link("/?root=second.typ")[tab demo]),
  link("/?root=settings.typ")[settings],
)
```

== The better way
Of course, links are unstyled then, here's a more complex example that mimics the buttons:
```typst
#let tabs(accent, active) = {
    let tab(name, ..args) = context {
        let activity = if active == lower(name) { accent } else { neutral }
        let display-name = if name == "main" { "Home" } else { name }
        link(
            "/?root=" + lower(name) + ".typ",
            box(
                inset: 0.6em,
                baseline: 0.6em,
                radius: 0.3em,
                stroke: 0.3mm + activity,
                text(display-name),
            )
        )
    }

    let tabs = (
        "main",
        "SRA3",
        "UV",
        "DTF",
        "Stickers",
        "Leftovers",
        "Ribbon",
    )

    context [
        #set align(center)
        #grid(
            columns: tabs.len(),
            gutter: 1em,
            ..tabs.map(tab),
        )
    ]
}
```

This is placed in `theme.typ`, then imported in every file and called like `#tabs(green)[dtf]`

