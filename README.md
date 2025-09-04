# MCP Browser Exploration

A **thought-provoking exploration** of running Model Context Protocol (MCP) in the browser, challenging assumptions about browser limitations and investigating multiple approaches to bridge the gap between browser environments and MCP servers.

## Overview

This project explores a fundamental question: **Can MCP servers run in browsers?** 

The initial assumption was that this is impossible because MCP servers communicate via stdio (stdin/stdout), and browsers cannot spawn child processes or access stdio directly. However, this exploration reveals that **the answer is more nuanced and interesting than initially thought**.

Through investigating different architectural approaches, we discover that:
- **Remote MCP servers CAN run in browsers** using the official Streamable HTTP transport
- **Browser-native tools** can provide MCP-like functionality without external dependencies
- **The browser security model** actually enables rather than prevents certain MCP implementations

## Architecture Approaches

### 1. Remote MCP Server Approach (`/remote/`) ⭐ **RECOMMENDED**

**Concept**: Connect to remote MCP servers using the official [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http).

```
Browser MCP Client ←→ HTTP/SSE ←→ Remote MCP Server
```

**Files**:
- `remote/index.html` - Browser MCP client with Streamable HTTP transport
- `remote/README.md` - Documentation for remote MCP approach

**How it works**:
1. Browser client makes HTTP POST requests to remote MCP server
2. Server responds with JSON or initiates SSE stream
3. Session management via `Mcp-Session-Id` header
4. Protocol versioning via `MCP-Protocol-Version` header
5. Real-time updates via Server-Sent Events

**Pros**:
- **Pure browser solution** - no external processes required
- **Official MCP specification** - uses standard Streamable HTTP transport
- **Production ready** - designed for web deployment
- **Real-time communication** - SSE for server-initiated messages
- **Session persistence** - maintains state across requests
- **Works with any remote MCP server** - Python, Node.js, etc.

**Cons**:
- Requires remote MCP server with HTTP transport support
- Depends on internet connection
- CORS policies may need configuration

### 2. WebSocket Proxy Approach (`/proxy/`)

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

### 3. Web Worker + WASM Approach (`/worker/`)

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

## Key Insights & Thought-Provoking Discoveries

### The Initial Assumption Was Wrong

The exploration began with the assumption that **MCP servers cannot run in browsers** due to stdio communication requirements. However, this investigation reveals that **the MCP specification actually provides multiple transport mechanisms**, including one specifically designed for web environments.

### MCP is Just JSON-RPC 2.0

The crucial realization: **MCP is simply JSON-RPC 2.0 over different transports**. This means:

- No complex protocol to implement
- Standard JSON-RPC request/response pattern
- MCP lifecycle: `initialize` → `initialized` → operations → `shutdown`
- **Transport-agnostic design** enables multiple implementation approaches

### Browser Limitations vs. Opportunities

**Traditional Limitations:**
- Cannot spawn child processes (`spawn()`, `exec()`)
- Cannot access stdio directly
- Cannot run arbitrary server processes
- Cannot make system-level calls

**But Browsers Enable:**
- **HTTP communication** with remote servers
- **WebSocket connections** for real-time communication
- **Web Workers** for background processing
- **WebAssembly** for near-native performance
- **Rich APIs** for device access, storage, and more

### The Fundamental Question Revisited

**Can MCP servers run in browsers?** The answer depends on how we define "run":

- **Local MCP servers**: Cannot run directly due to stdio requirements
- **Remote MCP servers**: **CAN run** using Streamable HTTP transport
- **Browser-native MCP-like tools**: **CAN run** using browser APIs
- **WASM-based MCP servers**: **COULD run** if specifically compiled for WASM

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

## Conclusion: A Thought-Provoking Journey

This exploration challenges conventional wisdom about browser limitations and reveals surprising possibilities:

### Key Discoveries

1. **The initial assumption was wrong** - MCP servers CAN run in browsers using the official Streamable HTTP transport
2. **Transport-agnostic design** - MCP's JSON-RPC foundation enables multiple implementation approaches
3. **Browser security model enables rather than prevents** certain MCP implementations
4. **Multiple viable solutions exist** - from remote servers to browser-native tools
5. **The question "Can MCP run in browsers?" has nuanced answers** depending on the specific use case

### Thought-Provoking Implications

- **Browser limitations are often perceived constraints** rather than absolute barriers
- **Official specifications can provide unexpected solutions** (Streamable HTTP transport)
- **The MCP protocol's design** anticipates web deployment scenarios
- **Browser APIs are more powerful than commonly assumed** for AI tool integration
- **The future of AI tools in browsers** may be more flexible than initially thought

### Practical Outcomes

- **Remote MCP approach** is production-ready for web applications
- **Browser-native tools** provide a compelling alternative for pure client-side deployment
- **Multiple architectural patterns** can coexist for different use cases
- **The exploration itself** demonstrates the value of questioning initial assumptions

This investigation shows that **thoughtful exploration of "impossible" problems** can lead to surprising and practical solutions. The browser environment, often seen as limiting, actually provides rich opportunities for AI tool integration when approached with the right mindset.

## Files

- `remote/` - **Remote MCP server approach (RECOMMENDED)**
- `proxy/` - WebSocket proxy approach
- `worker/` - Web Worker + WASM approach  
- `browser-tools.json` - Comprehensive list of browser-native tools
- `README.md` - This documentation

## License

MIT License - feel free to use and modify for your projects.

---

**This exploration demonstrates the value of questioning assumptions and investigating "impossible" problems. Sometimes the most interesting solutions emerge when we challenge what we think we know about system limitations.**
