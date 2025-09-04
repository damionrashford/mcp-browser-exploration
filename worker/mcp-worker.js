let stdoutBuffer = '';
let stdinBuffer = '';
let wasmInstance = null;

// Load and initialize WASM-based MCP server
async function initWasm(serverPath) {
  try {
    const wasmModule = await WebAssembly.instantiateStreaming(fetch(serverPath), {
      wasi_snapshot_preview1: {
        // Emulate WASI stdio
        fd_write: (fd, iovs, iovsLen, nwritten) => {
          if (fd === 1 || fd === 2) { // stdout or stderr
            const memory = wasmInstance.exports.memory;
            const iov = new Uint32Array(memory.buffer, iovs, iovsLen * 2);
            let written = 0;
            for (let i = 0; i < iovsLen; i++) {
              const ptr = iov[i * 2];
              const len = iov[i * 2 + 1];
              const data = new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len));
              if (fd === 1) {
                stdoutBuffer += data;
                if (data.includes('\n')) {
                  postMessage({ type: 'stdout', data: stdoutBuffer });
                  stdoutBuffer = '';
                }
              } else {
                postMessage({ type: 'stderr', data });
              }
              written += len;
            }
            new Uint32Array(memory.buffer, nwritten, 1)[0] = written;
            return 0;
          }
          return -1;
        },
        fd_read: (fd, iovs, iovsLen, nread) => {
          if (fd === 0 && stdinBuffer) { // stdin
            const memory = wasmInstance.exports.memory;
            const iov = new Uint32Array(memory.buffer, iovs, iovsLen * 2);
            const bytes = new TextEncoder().encode(stdinBuffer);
            let read = 0;
            for (let i = 0; i < iovsLen && read < bytes.length; i++) {
              const ptr = iov[i * 2];
              const len = iov[i * 2 + 1];
              const toRead = Math.min(len, bytes.length - read);
              new Uint8Array(memory.buffer, ptr, toRead).set(bytes.subarray(read, read + toRead));
              read += toRead;
            }
            stdinBuffer = ''; // Clear after reading
            new Uint32Array(memory.buffer, nread, 1)[0] = read;
            return 0;
          }
          return -1;
        }
      }
    });
    wasmInstance = wasmModule.instance;
    if (wasmInstance.exports._start) {
      wasmInstance.exports._start(); // Run WASM entrypoint
    }
    postMessage({ type: 'init', serverPath });
  } catch (e) {
    postMessage({ type: 'stderr', data: `Init error: ${e.message}` });
  }
}

// Receive stdin from main thread
onmessage = (event) => {
  if (event.data.type === 'stdin') {
    if (!wasmInstance) {
      initWasm(event.data.serverPath);
    }
    stdinBuffer += event.data.data; // Append to virtual stdin
  }
};