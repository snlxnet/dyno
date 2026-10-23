# /// script
# dependencies = [ "bottle", "bottle-cors-plugin" ]
# ///

from bottle import route, run, request, app
from bottle_cors_plugin import cors_plugin
from pathlib import Path

@route("/")
def index():
    return "Hi " + request.query.name

Path("main.typ").touch()

app().install(cors_plugin("*"))
run(host="0.0.0.0", port=4000)
