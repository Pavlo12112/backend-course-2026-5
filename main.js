const http = require('http');
const { Command } = require('commander');
const fs = require('fs').promises;
const path = require('path');

const program = new Command();

program
  .requiredOption('-h, --host <type>')
  .requiredOption('-p, --port <type>')
  .requiredOption('-c, --cache <type>');

program.parse(process.argv);
const options = program.opts();

const cacheDir = options.cache;

require('fs').mkdirSync(cacheDir, { recursive: true });

const server = http.createServer(async (req, res) => {
  const code = req.url.slice(1); // /200 → 200
  const filePath = path.join(cacheDir, `${code}.jpg`);

  try {
    if (req.method === 'GET') {
      const data = await fs.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    }

    else if (req.method === 'PUT') {
      let body = [];

      req.on('data', chunk => body.push(chunk));
      req.on('end', async () => {
        body = Buffer.concat(body);

        await fs.writeFile(filePath, body);
        res.writeHead(201);
        res.end("Created");
      });
    }

    else if (req.method === 'DELETE') {
      await fs.unlink(filePath);
      res.writeHead(200);
      res.end("Deleted");
    }

    else {
      res.writeHead(405);
      res.end("Method Not Allowed");
    }

  } catch (err) {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(options.port, options.host);