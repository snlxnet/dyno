#let text = ""; #document("test.pdf")[
  = Hello, world
  #let url(url) = text += url + "\n"

  #url("https://example.com")
  #url("https://typst.app")
]

#asset("out.txt", text)

