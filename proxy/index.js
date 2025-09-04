const { spawn } = require('child_process');
const WebSocket = require('ws');

const serverPath = process.argv[2];
if (!serverPath) {
  console.error('Usage: node proxy.js /path/to/server');
  process.exit(1);
}
const command = serverPath.endsWith('.py') ? 'python' : serverPath.endsWith('.js') ? 'node' : 'npx';
const args = serverPath.startsWith('@') ? [serverPath] : [