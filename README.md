# MCP Browser Exploration

An exploration of running Model Context Protocol (MCP) in the browser, investigating different approaches to bridge the gap between browser environments and MCP servers.

## Overview

This project explores the fundamental challenge of running MCP in browsers: **MCP servers communicate via stdio (stdin/stdout), but browsers cannot spawn child processes or access stdio directly**.

## Architecture Approaches

### 1. WebSocket Proxy Approach (`/proxy/`)

**Concept**: A Node.js proxy that bridges WebSocket ↔ stdio communication.

```
Browser MCP Client ←→ WebSocket ←→ Node.js Proxy ←→ stdio ←→ MCP Server
```

**Files**:
- `proxy/index.html` - Browser MCP client with WebSocket communication
- `proxy/index.js` - Node.js proxy server (incomplete implementation)

**How it works**:
1. Browser client connects to WebSocket proxy
2. Proxy spawns MCP server as child process
3. Proxy bridges WebSocket messages ↔ stdio
4. MCP protocol flows through the bridge

**Pros**:
- Can run any MCP server (Python, Node.js, etc.)
- Proper MCP protocol lifecycle
- Robust error handling

**Cons**:
- Requires external Node.js process
- Not suitable for pure browser deployment

### 2. Web Worker + WASM Approach (`/worker/`)

**Concept**: Direct browser execution using WebAssembly with WASI stdio emulation.

```
Browser MCP Client ←→ Web Worker ←→ WASM Module (with WASI stdio emulation)
```

**Files**:
- `worker/index.html` - Browser MCP client using Web Workers
- `worker/mcp-worker.js` - Web Worker with WASI stdio emulation

**How it works**:
1. Web Worker loads WASM module
2. WASI stdio functions are emulated in JavaScript
3. MCP protocol flows through virtual stdio
4. No external processes required

**Pros**:
- Pure browser solution
- No server dependencies
- WASI stdio emulation is clever

**Cons**:
- Requires WASM-compatible MCP server (rare)
- Limited to WASM-based tools only

## Key Insights

### MCP is Just JSON-RPC 2.0

The crucial realization: **MCP is simply JSON-RPC 2.0 over stdio**. This means:

- No complex protocol to implement
- Standard JSON-RPC request/response pattern
- MCP lifecycle: `initialize` → `initialized` → operations → `shutdown`

### Browser Limitations

Browsers cannot:
- Spawn child processes (`spawn()`, `exec()`)
- Access stdio directly
- Run arbitrary server processes
- Make system-level calls

### The Fundamental Problem

**You cannot run real MCP servers in browsers** because:
- MCP servers are external processes
- Browsers are sandboxed for security
- No way to bridge this gap without external components

## Alternative: Browser-Native Tools

Since real MCP servers can't run in browsers, the alternative is implementing **browser-native tools** that:

- Use only browser APIs
- Implement MCP-like protocol
- Provide limited but useful functionality

### Comprehensive Browser Tools

The `browser-tools.json` file contains **150+ browser-native tools** organized into 20 categories:

- **Network**: fetch, WebSocket, CORS, beacon
- **Storage**: localStorage, sessionStorage, IndexedDB, cookies, cache
- **Device**: geolocation, orientation, battery, screen, clipboard, vibration
- **Media**: file processing, image manipulation, audio/video recording, QR scanning
- **Browser**: DOM queries, history, downloads, printing, fullscreen
- **Crypto**: hashing, encryption, key generation, signing
- **Utility**: base64, URL encoding, JSON, regex, date formatting
- **Communication**: notifications, sharing, speech synthesis/recognition
- **Performance**: metrics, memory, network info, timing
- **Workers**: Web Workers, SharedArrayBuffer, Service Workers
- **WASM**: compilation, instantiation, WASI operations
- **Graphics**: WebGL, Canvas 2D, WebGPU, OffscreenCanvas
- **WebRTC**: peer connections, data channels, screen sharing
- **Payment**: Payment Request, Apple Pay, Google Pay
- **FileSystem**: File System Access API, file/directory pickers
- **Bluetooth**: Bluetooth scanning, USB devices, Serial Port, HID
- **Advanced**: Web Locks, Streams, Web Components, Observers
- **Input**: Gamepad, Touch, Pointer, Keyboard events
- **PWA**: Background Sync, Push Notifications, Periodic Sync
- **Experimental**: WebTransport, Web Codecs, Web NFC, WebAuthn

## Implementation Examples

### Browser MCP Client

```javascript
class BrowserMCPClient {
  async initialize() {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {
          roots: { listChanged: true },
          sampling: {},
          elicitation: {}
        },
        clientInfo: {
          name: 'BrowserMCPClient',
          version: '1.0.0'
        }
      }
    });
    return response;
  }

  async listTools() {
    return await this.sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'list_tools',
      params: {}
    });
  }

  async callTool(name, params) {
    return await this.sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'call_tool',
      params: { name, arguments: params }
    });
  }
}
```

### Browser-Native Tool Implementation

```javascript
const browserTools = {
  fetch_url: async (params) => {
    const response = await fetch(params.url, {
      method: params.method || 'GET',
      headers: params.headers,
      body: params.body
    });
    return { content: await response.text() };
  },

  local_storage: async (params) => {
    switch (params.action) {
      case 'get':
        return { value: localStorage.getItem(params.key) };
      case 'set':
        localStorage.setItem(params.key, params.value);
        return { success: true };
      case 'remove':
        localStorage.removeItem(params.key);
        return { success: true };
      default:
        throw new Error(`Unknown action: ${params.action}`);
    }
  },

  geolocation: async () => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }),
        reject
      );
    });
  }
};
```

## Usage

### WebSocket Proxy Approach

```bash
# Start the proxy with an MCP server
node proxy/index.js /path/to/mcp-server.py

# Open proxy/index.html in browser
# Connect to ws://localhost:8080
```

### Web Worker + WASM Approach

```bash
# Open worker/index.html in browser
# Provide path to WASM MCP server
# (Requires WASM-compatible MCP server)
```

### Browser-Native Tools

```javascript
// Implement MCP-like protocol with browser tools
const client = new BrowserMCPClient();
await client.initialize();
const tools = await client.listTools();
const result = await client.callTool('fetch_url', { url: 'https://example.com' });
```

## Conclusion

This exploration reveals that:

1. **Real MCP servers cannot run in browsers** due to security constraints
2. **WebSocket proxy is the standard solution** for browser ↔ MCP communication
3. **Browser-native tools** provide an alternative for pure browser deployment
4. **MCP protocol is simple** (just JSON-RPC 2.0) and can be implemented in browsers
5. **Browser APIs are incredibly powerful** and can replace many MCP server capabilities

The browser-native approach offers a compelling alternative for applications that need MCP-like functionality without external dependencies.

## Files

- `proxy/` - WebSocket proxy approach
- `worker/` - Web Worker + WASM approach  
- `browser-tools.json` - Comprehensive list of browser-native tools
- `README.md` - This documentation

## License

MIT License - feel free to use and modify for your projects.
