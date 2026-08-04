import fs from "fs/promises";

function htmlAsString() {
  return {
    name: "html-as-string",
    async load(id) {
      if (id.endsWith(".html")) {
        const html = await fs.readFile(id, "utf8");
        return `export default ${JSON.stringify(html)};`;
      }
    },
  };
}

export default {
  input: "server.ts",
  output: { file: "server.js", minify: true },
  platform: "node",
  plugins: [htmlAsString()],
};
