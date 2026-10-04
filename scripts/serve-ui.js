const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3001;
const STATIC_DIR = path.resolve(__dirname, "..", "docs", "theme-explorations");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/" || reqPath === "") reqPath = "/desktop-suite.html";
  if (reqPath.startsWith("/themes/")) {
    reqPath = reqPath.replace(/^\/themes\//, "/");
  }

  const filePath = path.resolve(STATIC_DIR, "." + reqPath);

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🎨 Schedulfy 'Whole UI' Atelier Edition running at: http://localhost:${PORT}`);
});
