#import "dyno.typ": *
#import "site/main.typ": theme
#import "site/colors.typ": screen
#set raw(theme: "mocha.tmTheme")
#let purple = rgb("#a8a5ff")

#set document(
  title: "dyno | snlx.net",
  description: "Рантайм для Typst с полями ввода",
)
#set page(height: auto)
#show: theme("/dyno", "/ru/dyno", "/card-ru.svg", "dark", 0, ru-footer: true)
#set text(size: 13pt)

#let demo(a, b) = grid(
  columns: (1fr, auto, 1fr),
  gutter: 1em,
  align: horizon,
  a,
  sym.arrow,
  b,
)
#let warning(it) = text(fill: rgb("#f9e2af"), [> #emoji.warning #it])

// черновик перевода был сделан GPT-6 Luna. Здесь он был не очень, от него мало чего осталось.

Typst мне очень нравится легкостью освоения ---
его это самый простой язык в плане объяснения не-программисту.
Он бы идеально подошел для простых приложений, которым нужно что-то визуализировать,
но у него нет полей ввода.
Dyno их добавляет:

#demo(
  [
  ```typst
  #import "dyno.typ": input

  #let answer = 42
  #input(answer)

  Удвоенное значение: #(answer * 2)
  ```
  ],
  box[
    #let answer = 42
    #input(answer)

    Удвоенное значение: #(answer * 2)
  ],
)

#demo(
  [
  ```typst
  #let flavor = "ваниль"
  Вкус мороженого: #input(flavor)

  Т.е.
  #if flavor == "ваниль" [
    #emoji.icecream.soft
  ] else if flavor == "шоколад" [
    #emoji.chocolate
  ] else if flavor == "клубника" [
    #emoji.strawberry
  ]
  ```
  ],
  box[
    #let flavor = "ваниль"
    Вкус мороженого: #input(flavor)

    Т.е.
    #if flavor == "ваниль" [
      #emoji.icecream.soft
    ] else if flavor == "шоколад" [
      #emoji.chocolate
    ] else if flavor == "клубника" [
      #emoji.strawberry
    ]
  ],
)

Ещё есть кнопки перевернуть:
#demo(
  [
  ```typst
  #import "dyno.typ": input, swap
  #let x = 30
  #let y = 20
  #input(x)
  #swap(x, y)
  #input(y)
  #rect(width: x*1mm, height: y*1mm)
  ```
  ],
  box[
  #set rect(stroke: rgb("a8a5ff"))
  #let x = 30
  #let y = 20
  #input(x)
  #swap(x, y)
  #input(y)
  #rect(width: x*1mm, height: y*1mm, stroke: rgb("a8a5ff"))
  ]
)

#warning[
Не ставьте два поля ввода в одну строку кода: `#input(a) #input(b)`
]

И кнопка печати:
#demo(
  [
  ```typst
  #box(inset: 0.6em, stroke: black)[
    печать
  ]<dyno-print>
  ```
  ],
  box[
  #set box(inset: 0.6em, radius: 0.3em, fill: rgb("#2e2d39"), stroke: black)
  #box[
    печать
  ]<dyno-print>
  ]
)

Dyno умеет обращаться и к сети:
#demo(
  [
  ```typst
  5 случайных видов динозавров:
  #json(
    read(
      "https://dinoipsum.com/api/?format=json&paragraphs=1&words=5",
      encoding: none,
    )
  )
  ```
  ],
  box[
  5 случайных видов динозавров:
  #json(
    read(
      "https://dinoipsum.com/api/?format=json&paragraphs=1&words=5",
      encoding: none,
    )
  ).at(0)
  ]
)

#let button(it) = box(
  stroke: screen.dark.border,
  fill: screen.dark.header,
  inset: 0.6em,
  radius: 0.3em,
  align(center, it),
)

= Начало работы
Заходим в #link("/app")[веб-версию dyno], нажимаем единственную кнопку и создем папку проекта.
Открываем эту папку в редакторе (#link("https://vscode.dev")[например, в vscode]),
дописываем что-нибудь в `main.typ` и сохраняем файл.

Отступление: `#set page(fill: ...)` меняет еще и фон _вокруг_ страницы,
а `#set page(background: ...)` --- нет.

Чтобы селф-хостить, можно зайти в корень проекта и запустить `node server.js`.

= Настройки стилей

See #link("https://dyno.snlx.net/?root=settings.typ")[the settings demo page]

