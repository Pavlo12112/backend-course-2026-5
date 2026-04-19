const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const commander = require("commander");
const superagent = require("superagent");

// 1. Налаштування CLI
const program = new commander.Command();

program
.requiredOption("-H, --host <host>")
.requiredOption("-p, --port <port>")
.requiredOption("-c, --cache <path>");

program.parse(process.argv);

const options = program.opts();

const host = options.host;
const port = parseInt(options.port);
const cacheDir = path.resolve(options.cache);
const jsonFilePath = path.join(__dirname, "bank_managers.json");

let managersData = [];

// JSON
async function loadManagers() {
  try {
    const data = await fs.readFile(jsonFilePath, "utf-8");
    managersData = JSON.parse(data);
  } catch {
    console.log("json not found");
  }
}

// cache
async function ensureCache() {
  try {
    await fs.access(cacheDir);
  } catch {
    await fs.mkdir(cacheDir, { recursive: true });
  }
}

const server = http.createServer(async (req, res) => {
  const urlPath = req.url.slice(1);

  try {
    const manager = managersData.find(
      m => m.PERSON_ID === parseInt(urlPath)
    );

    if (manager && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      return res.end(JSON.stringify(manager));
    }

    const code = urlPath;
    const filePath = path.join(cacheDir, `${code}.jpg`);

    if (req.method === "GET") {
      try {
        const file = await fs.readFile(filePath);

        res.writeHead(200, {
          "Content-Type": "image/jpeg"
        });

        return res.end(file);

      } catch {

        try {
          const result = await superagent
            .get(`https://http.cat/${code}`)
            .responseType("arraybuffer");

          await fs.writeFile(filePath, result.body);

          res.writeHead(200, {
            "Content-Type": "image/jpeg"
          });

          return res.end(result.body);

        } catch {
          res.writeHead(404);
          return res.end("Not found");
        }
      }
    }

    if (req.method === "PUT") {
      const chunks = [];

      req.on("data", chunk => chunks.push(chunk));

      req.on("end", async () => {
        await fs.writeFile(filePath, Buffer.concat(chunks));
        res.writeHead(201);
        res.end("Created");
      });

      return;
    }

    if (req.method === "DELETE") {
      await fs.unlink(filePath);
      res.writeHead(200);
      return res.end("Deleted");
    }

    res.writeHead(405);
    res.end("Method Not Allowed");

  } catch {
    res.writeHead(500);
    res.end("Server Error");
  }
});

async function start() {
  await ensureCache();
  await loadManagers();

  server.listen(port, host, () => {
    console.log(`http://${host}:${port}`);
  });
}

start();