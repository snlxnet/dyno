#import "@local/dyno:0.1.0": *
#import "@preview/yap:0.1.0": *

#set text(size: 14pt, font: "Departure Mono")
= Index

#let number = 0
#let checkbox = false
#let string = "hello"
#let sel = "first"

#let sel-num = if sel == "first" { 1 } else if sel == "second" { 2
} else if sel == "third" { 3 }

Number: #input(number) = #number \
Check: #input(checkbox) = #checkbox \
Notes: #input(string)

#let a-en = true
#let a = 10
#let b = 20

#input(a-en)
#if a-en {
  input(a)
}
#swap(a, b)
#input(b)
is #((if a-en { a } else { 1 }) * b)

#if checkbox [
  #image("file.svg")
]

Select: #input(sel) \
Selected: #sel-num

#if string != "" {
  notes(eval(string, mode: "markup"))
}

#pagebreak()
#for i in range(int(number)) {
  box(rect())
}

