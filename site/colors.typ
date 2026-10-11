#let print = (
  light: (
    header: cmyk(0%, 0%, 0%, 5%),
    border: cmyk(0%, 0%, 0%, 40%),
    page:   cmyk(0%, 0%, 0%, 0%),
    deep:   cmyk(0%, 0%, 0%, 100%),
    text:   cmyk(0%, 0%, 0%, 80%),
    accent: cmyk(90%, 0%, 80%, 0%),
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
    border: rgb("#aaaaaa"),
    page:   rgb("#eeeeee"),
    deep:   rgb("#000000"),
    text:   rgb("#444444"),
    accent: rgb("#00ac6d"),
    qrbg:   rgb("#dddddd"),
    qrfg:   rgb("#444444"),
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

