import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";

const PORT = 8000;

const MIME_TYPES = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "text/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpeg",
  gif: "image/gif",
  ico: "image/x-icon",
  svg: "image/svg+xml",
  wasm: "application/wasm",
};

const DYNO = [
  "index.html",
  "engine.html",
  "yap.css",
  "main.js",
  "analyze.js",
  "typst.js",
  "queue.js",
  "npm/browser.js",
  "npm/typst.js",
  "npm/nanotar.js",
  "npm/engine/engine.core2.wasm",
  "npm/engine/engine.core3.wasm",
  "npm/engine/engine.core.wasm",
  "tinymist/pkg/tinymist.js",
  "tinymist/pkg/tinymist_bg.wasm",
]

const STATIC_PATH = path.join(process.cwd(), "./").replace(/\/$/, "");

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
  const urlAsPath = decodeURI(url.split("?")[0]);
  const paths = [STATIC_PATH, urlAsPath];
  if (urlAsPath.endsWith("/")) paths.push("index.html");
  const filePath = path.join(...paths).replace(/\/$/, "");
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await checkExists(STATIC_PATH, urlAsPath);
  const found = !pathTraversal && exists;
  const streamPath = found || `${STATIC_PATH}/404.html`;
  const ext = path.extname(streamPath).substring(1).toLowerCase();
  const stream = fs.createReadStream(streamPath);
  return { found, ext, stream };
};

async function checkExists(base, file) {
  const lastPart = file.slice(1) || "index.html"
  if (DYNO.includes(lastPart)) {
    return path.join(base, "src", lastPart)
  }
  if (DYNO.includes(lastPart + ".html")) {
    return path.join(base, "src", lastPart + ".html")
  }
  
  const p = path.join(base, file)
  const exists = await fs.promises.access(p).then(...toBool);
  return exists ? p : null
}

http
  .createServer(async (req, res) => {
    const file = await prepareFile(req.url);
    const statusCode = file.found ? 200 : 404;
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
    res.writeHead(statusCode, { "Content-Type": mimeType });
    file.stream.pipe(res);
    console.log(`${req.method} ${req.url} ${statusCode}`);
  })
  .listen(PORT);

console.log(`Server running at http://127.0.0.1:${PORT}/`);
