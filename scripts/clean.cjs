const fs = require('node:fs');
for (const path of ['dist', 'server.js']) fs.rmSync(path, { recursive: true, force: true });
