#import "dyno.typ": *
#import "colors.typ": *
#import "yap.typ": notes

#set page(height: auto, margin: 0mm, fill: silver)
#set text(14pt, font: "Comfortaa", fill: white)
#show link: underline
#show link: set text(fill: purple)

// Customize
#context input-theme.update((default) => (
    ..default,
    inset: 0.6em,
    baseline: 0mm,
    radius: 0.3em,

    fill: gray,
    fill-focused: gray,
    fill-selected: gray,

    stroke: black,
    stroke-focused: purple,
    stroke-selected: purple,

    text: white,
    text-focused: purple,
    text-selected: red,
))

// Define variables
#let a = 80
#let b = 30
#let options = "one"
#let show-logo = true

// Process
#let count = if options == "one" {
  1
} else if options == "two" {
  2
} else if options == "way more" {
  100
}

#let shape = if a == b [square] else [rectangle]

// Draw the UI
#if show-logo [
  #figure(image("card.svg"))
]

Notes:
+ number inputs are auto-selected on focus, so you don't have to highlight a value to replace it
+ red means it will be replaced by the number you press next
+ try making it a square

Show logo: #input(show-logo)

How many #(shape)s: #input(options)

#input(a)
#swap(a, b)
#input(b)

$ #a times #b times count = #(a*b*count) "mm"^2 $

Vis:

#for _ in range(count) {
  box(width: a*1mm, height: b*1mm, stroke: 0.3mm + purple)
  h(3mm)
}

