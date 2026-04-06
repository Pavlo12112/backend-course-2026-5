const http = require('http');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .requiredOption('-h, --host <type>', 'server host')
  .requiredOption('-p, --port <type>', 'server port')
  .requiredOption('-c, --cache <type>', 'cache directory');

program.parse(process.argv);
const options = program.opts();

// створення кешу якщо нема
if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache);
}

// сервер
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Server running");
});

server.listen(options.port, options.host, () => {
  console.log(`Server running at http://${options.host}:${options.port}`);
});