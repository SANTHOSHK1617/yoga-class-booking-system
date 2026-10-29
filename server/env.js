// Minimal .env loader (no extra dependency). Existing environment variables win.
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '.env');
if (fs.existsSync(file)) {
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*?)\s*$/);
    if (!match || line.trim().startsWith('#')) continue;
    const value = match[2].replace(/^(['"])(.*)\1$/, '$2');
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}
