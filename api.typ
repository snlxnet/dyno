#import "dyno.typ": *

= API
#let name = "dyno"
Name: #input(name)

#read("http://localhost:4000?name=" + name)

