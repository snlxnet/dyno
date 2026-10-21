#import "dyno.typ": *
/*
#import "colors.typ": *
#import "site/main.typ": theme
#import "@preview/yap:0.1.0": notes

// #set page(height: auto)
#show: theme("/dyno", "/card.svg", "dark", 0)

// Customize
#context input-theme.update((default) => (
    ..default,
    inset: 0.6em,
    baseline: 0mm,
    radius: 0.3em,

    fill: silver,
    fill-focused: silver,
    fill-selected: silver,

    stroke: black,
    stroke-focused: purple,
    stroke-selected: purple,

    text: white,
    text-focused: purple,
    text-selected: red,
))
*/

// Define variables
#let a = 80
#let b = 30
#let options = "one"
#let show-notes = true

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
Show notes: #input(show-notes)

#if show-notes [
  Notes:
  + number inputs are auto-selected on focus, so you don't have to highlight a value to replace it
  + red means it will be replaced by the number you press next
  + try making it a square
]

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

Type to make it a presentation:
#let slide-note = ""
#input(slide-note)
#if slide-note != "" [
  #notes(eval(slide-note, mode: "markup"))
]

#link("/?root=second.typ")[another demo]

#v(20mm)
