import * as http from "node:http";

const PORT = 4000

http
  .createServer(async (req, res) => {
    console.log(req.url)
    const json = "received"
    res.writeHead(200, {
      "Content-Type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify(json))
  })
  .listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}/`);
