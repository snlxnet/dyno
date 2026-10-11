<img alt="dyno - dynamic output for typst" src="src/card.svg" style="width: 100%">

[Live Demo](https://dyno.snlx.net) (under construction, here be ~~dragons~~ dinosaurs!)

dyno (pronounced /ˈdaɪnoʊ/, like dino)
is a package that lets you create inputs
and a webapp that makes them work.
The documents are rendered in paged mode,
so it looks like Typst's PDF export, not the HTML one.

## Usage

Create a project directory.
Copy `src`, `server.js`, `dyno.typ` and `404.html` from here.
Create `main.typ`.
Run `node server.js` and [open the page in your browser](http://localhost:3000).

Import dyno in `main.typ` or another Typst file:
```typst
#import "dyno.typ": input, swap
```

Create a variable and an input:
```typst
#let lucky-number = 42
#input(lucky-number)
```

Use it:
```typst
Your lucky number is #lucky-number // or something
```

When the user enters something, variables are updated at the definition, so this will work too:
```typst
#let lucky-number = 42
Your lucky number is #lucky-number
#input(lucky-number)
```

You can also create inputs conditionally:
```typst
#let a = 10
#let enable-a = true

#input(enable-a)
#if enable-a [
  #input(a)
]
```

## Input types

The input type is determined by the variable data type. There are:
```typst
#let number = 0
#input(number)

#let checkbox = false
#input(checkbox)

#let string = "hello" // supports multi-line
#input(string)

#let select = "one"
#let as-maybe-number = if select == "one" {
  1
} else if select == "two" {
  2
} else if select == "many" [
  many
]
#input(select)
```

