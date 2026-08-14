## Status

Proof of concept kind-of done: replacing the values with tinymist.

I'll put the thought here cuz I've already forgot why I didn't merge this.
If the package is `@preview` instead of a local one,
Tinymist's go to references breaks down and only shows the definition.
So now I'm rewriting it in RegEx.

## Usage

```typst
#import "lib.typ": num

#let user-number = 1 // default value

// ui

Input: #num[user-number]\
Its value: #user-number
```

the `// ui` is where the app is going to update all the variables used in `num`, `txt`, `chk`.

Place `server.js` (you get it from `npm run build`) in the same directory as the source files are and run it.
I want to add automatic builds through github actions this week, so you don't have to clone the entire project.

## Building

```shell
npm install
npm run build
```

## Features

- number inputs
- text inputs
- dynamic page size
- multi-page
- checkboxes
- focus tracking
- dyn guess on data type
- proper font support

## Font Loading

1. Place a `.ttf` or `.otf` font in the same directory as the source Typst files
2. Rename the file so it matches the font family name and is in lowercase (e.g. `DepartureMono-Regular.otf` -> `departure mono.otf`)
3. Use it in Typst (`#set text(font: "Departure Mono")`)

## Missing Features

- swap button

Eventually:

- browser-only version
- radio buttons - can't come up with a DX I like
