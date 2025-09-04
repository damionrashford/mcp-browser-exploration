# Remote MCP Client (Streamable HTTP)

This implementation demonstrates how to connect to **remote MCP servers** using the official [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http) specification.

## Why This Works in Browsers

Unlike the stdio transport, **Streamable HTTP transport is designed for web environments**:

- Uses standard HTTP POST/GET requests
- Supports Server-Sent Events (SSE) for real-time communication
- No child process spawning required
- Works with any HTTP-enabled MCP server

## How It Works

```
Browser MCP Client ←→ HTTP/SSE ←→ Remote MCP Server
```

### Transport Details

1. **Initialization**: HTTP POST with `InitializeRequest`
2. **Tool Calls**: HTTP POST with `tools/call` requests
3. **Server Messages**: SSE stream for real-time updates
4. **Session Management**: Uses `Mcp-Session-Id` header
5. **Protocol Versioning**: Uses `MCP-Protocol-Version` header

### Key Features

- **Session Management**: Automatic session ID handling
- **SSE Streaming**: Real-time server-to-client communication
- **Tool Discovery**: Lists available tools, resources, and prompts
- **Error Handling**: Proper HTTP status code handling
- **Protocol Compliance**: Full MCP 2025-06-18 specification support

## Usage

1. Open `index.html` in your browser
2. Enter the URL of a remote MCP server (e.g., `https://api.example.com/mcp`)
3. Click "Connect to MCP Server"
4. Browse available tools, resources, and prompts
5. Test tool calls with custom arguments

## Example Server URLs

- **Local Development**: `http://localhost:3000/mcp`
- **Production**: `https://your-mcp-server.com/mcp`
- **Custom Connectors**: Use Claude's Custom Connector URLs

## Security Considerations

The implementation includes security best practices:

- **Origin Validation**: Servers should validate Origin headers
- **Localhost Binding**: Local servers should bind to 127.0.0.1
- **Authentication**: Proper session management with secure session IDs
- **HTTPS**: Use HTTPS in production environments

## Protocol Compliance

This client implements the full [Streamable HTTP transport specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http):

- ✅ HTTP POST for client requests
- ✅ HTTP GET for SSE streams
- ✅ Session management with `Mcp-Session-Id`
- ✅ Protocol versioning with `MCP-Protocol-Version`
- ✅ Proper Accept headers
- ✅ Error handling and status codes
- ✅ SSE event processing
- ✅ Request/response correlation

## Advantages Over Other Approaches

1. **No Proxy Required**: Direct browser-to-server communication
2. **Standard HTTP**: Uses well-established web protocols
3. **Real-time Updates**: SSE for server-initiated messages
4. **Session Persistence**: Maintains state across requests
5. **Production Ready**: Designed for web deployment

## Limitations

- Requires remote MCP server with HTTP transport
- Depends on server implementing Streamable HTTP specification
- CORS policies may need configuration
- Requires internet connection

This approach solves the fundamental browser limitation by using the official web-friendly transport specification!
