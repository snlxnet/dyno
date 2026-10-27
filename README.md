<img alt="dyno - dynamic output for typst" src="src/card.svg" style="width: 100%">

[Live Demo](https://dyno.snlx.net)

I love Typst’s approachability - it’s the easiest language to explain to a non-programmer! It would be the perfect fit for simple apps that need to visualize things, but it’s missing inputs. Dyno adds them:

```typst
#import "dyno.typ": input

#let answer = 42
#input(answer)

Double is #(answer * 2)
```

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

It also has swap buttons:

```typst
#import "dyno.typ": input, swap
#let x = 30
#let y = 20
#input(x)
#swap(x, y)
#input(y)
#rect(width: x*1mm, height: y*1mm)
```

> ⚠️ Don’t put 2 inputs on one source line like: `#input(a) #input(b)`

And a print button:

```typst
#box(inset: 0.6em, stroke: black)[
  print
]<dyno-print>
```

Dyno also allows accessing the network:

```typst
5 random dinosaur species:
#json(
  read(
    "https://dinoipsum.com/api/?format=json&paragraphs=1&words=5",
    encoding: none,
  )
)
```

## Getting started

Go to [the web version of dyno](https://dyno.snlx.net/app), click the only button and make a project folder. Open the same folder in an editor ([vscode, for example](https://vscode.dev)), try typing something in `main.typ` and saving the file.

Sidenote: `#set page(fill: ...)` will change the background around the page too, but `#set page(background: ...)` won’t.

You can self-host it after that by starting `node server.js` in the root of the project.

## Style settings

See [the settings demo page](https://dyno.snlx.net/?root=settings.typ)

