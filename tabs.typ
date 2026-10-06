#let files = (
  наклейки: "main.typ",
  дока: "doc.typ",
)

#let accent = green
#let border-normal = gray

#let tabs(active) = {
  let tabs = files.pairs().map(((name, path)) => link(
    "/?root=" + path,
    if name == active.text {
      underline(text(fill: accent, name))
    } else {
      text(fill: border-normal, name)
    }
  ))

  grid(
    ..tabs,
    gutter: 0.5em,
    columns: tabs.len(),
  )
}


