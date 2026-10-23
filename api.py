# /// script
# dependencies = [ "bottle", "bottle-cors-plugin" ]
# ///

from bottle import route, run, request, app
from bottle_cors_plugin import cors_plugin

@route("/")
def index():
    return "Hi " + request.query.name

app().install(cors_plugin("*"))
run(host="0.0.0.0", port=4000)
