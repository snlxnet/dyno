#let print = (
  light: (
    header: cmyk(0%, 0%, 0%, 0%),
    border: cmyk(0%, 0%, 0%, 20%),
    page:   cmyk(0%, 0%, 0%, 0%),
    deep:   cmyk(0%, 0%, 0%, 100%),
    text:   cmyk(0%, 0%, 0%, 80%),
    accent: cmyk(60%, 0%, 70%, 0%),
    qrbg:   cmyk(0%, 0%, 0%, 0%),
    qrfg: cmyk(0%, 0%, 0%, 100%),
  ),
  paleo: (
    header: cmyk(46%, 55%, 54%, 56%),
    border: cmyk(59%, 63%, 62%, 76%),
    page:   cmyk(59%, 63%, 62%, 76%),
    deep:   cmyk(23%, 21%, 24%, 2%),
    text:   cmyk(30%, 31%, 37%, 10%),
    accent: cmyk(23%, 21%, 24%, 2%),
    qrbg:   cmyk(23%, 21%, 24%, 2%),
    qrfg:   cmyk(46%, 55%, 54%, 56%),
  ),
)

#let screen = (
  light: (
    header: rgb("#ffffff"),
    border: rgb("#bbbbbb"),
    page:   rgb("#ffffff"),
    deep:   rgb("#000000"),
    text:   rgb("#444444"),
    accent: rgb("#00ac6d"),
    qrbg:   rgb("#dddddd"),
    qrfg:   rgb("#444444"),
  ),
  air: (
    header: rgb("#ececf4"),
    border: rgb("#dde"),
    page:   rgb("#ffffff"),
    deep:   rgb("#1e1e1e"),
    text:   rgb("#343a40"),
    accent: rgb("#6965db"),
    qrbg:   rgb("#ffffff"),
    qrfg:   rgb("#343a40"),
  ),
  dark: (
    header: rgb("#2e2d39"),
    border: rgb("#000000"),
    page:   rgb("#121212"),
    deep:   rgb("#eeeeee"),
    text:   rgb("#cccccc"),
    accent: rgb("#a8a5ff"),
    qrbg:   rgb("#eeeeee"),
    qrfg:   rgb("#121212"),
  ),
  paleo: print.paleo.pairs().map(((k, v)) => (k, rgb(v))).to-dict(),
)

#let css = (:)
#let tab = "    --"
#for (colorscheme, colors) in screen.pairs() {
  let style = ":root {\n"
  style += colors.pairs().map(((k, v)) => tab + k + ": " + v.to-hex() + ";").join("\n")
  style += "\n}"

  css.insert(colorscheme, style)
}

