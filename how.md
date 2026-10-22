# How to make it work with Python

Option one is to make a proper python lib with a `dyno.send(msg)` and a `dyno.get()` on both sides.

Option two is to not make it python-specific and focus on the HTTP request implementation.
The events...

(READING mdn sse)

Option 3:
- client: have a `server.json` file, add a `dyno.write(json)`.
- server: sync the `server.json` file

So watch a file on the server, send updates over ws, watch the write function on the client, send the updates back.
This overcomes the limitation of the request text needing to be a valid file path.

Feels less native than the read function though. What does feel native?
1. Doing that with all files. Or
2. sticking with the request-response nature of the `read`

On the 2. Sending updates back is probably a websocket

