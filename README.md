# 🎥 WebRTC Video Call Application

A premium, self-hosted 1:1 WebRTC video calling application with end-to-end encryption. Built with Go backend and React/TypeScript frontend.

## ✨ Features

- **🔒 Secure**: End-to-end encrypted peer-to-peer video calling
- **🎨 Premium Design**: Modern UI with glassmorphism effects and smooth animations
- **⚡ Fast**: Direct peer-to-peer connections with WebRTC
- **🚀 Self-Hosted**: Complete control over your infrastructure
- **📱 Responsive**: Works on desktop, tablet, and mobile devices
- **🎯 Simple**: No registration required - just share a room ID

## 🏗️ Architecture

- **Backend**: Go with Chi router and WebSocket signaling
- **Frontend**: React + TypeScript + Vite
- **Real-time**: WebSocket signaling server for WebRTC negotiation
- **Deployment**: Single binary with embedded frontend assets

## 🚀 Quick Start

### Prerequisites

- Go 1.25.2 or later
- Node.js 18+ and npm
- A modern web browser with WebRTC support

### Build

```bash
# Make the build script executable (first time only)
chmod +x build.sh

# Run the build
./build.sh
```

This will:
1. Build the React frontend
2. Copy assets to the Go embed directory
3. Compile the Go server with embedded assets

### Run

```bash
# Basic usage
./server

# Custom port
./server -addr :3000

# Allow CORS for development
./server -allow-all-origins

# With ngrok tunneling
./server -with-ngrok

# Custom ICE servers (for STUN/TURN)
./server -ice-servers-json '[{"urls":"stun:stun.l.google.com:19302"}]'
```

## 🌐 Usage

1. Start the server
2. Open http://localhost:8080 in your browser
3. Share the generated room ID with another person
4. Both users join the same room to start the call

## 🎨 Design Features

The application features a premium, modern design with:

- **Vibrant color gradients** using HSL colors for richer aesthetics
- **Glassmorphism effects** with backdrop blur on UI elements
- **Smooth animations** with cubic-bezier easing
- **Micro-interactions** on hover and focus states
- **Animated background** with subtle gradient shifting
- **Premium typography** using Inter font family
- **Dark theme** optimized for video calling
- **Responsive layout** that adapts to all screen sizes

## 📁 Project Structure

```
.
├── cmd/server/          # Main entry point
│   └── main.go
├── internal/
│   ├── httpserver/      # HTTP routing and handlers
│   │   └── router.go
│   └── ws/              # WebSocket signaling
│       ├── hub.go       # Room management
│       └── handler.go   # WebSocket handler
├── web/                 # Frontend source
│   ├── src/
│   │   ├── App.tsx      # Main React component
│   │   ├── webrtc.ts    # WebRTC manager
│   │   ├── ws.ts        # WebSocket client
│   │   ├── index.css    # Design system
│   │   └── ui.css       # Component styles
│   └── dist/            # Built assets (generated)
├── webembed/            # Go embed package
│   ├── fs.go
│   └── dist/            # Embedded assets (copied from web/dist)
├── build.sh             # Build automation script
└── server               # Compiled binary (generated)
```

## 🔧 Development

### Frontend Development

```bash
cd web
npm install
npm run dev
```

This starts the Vite dev server with hot reload at http://localhost:5173

### Backend Development

```bash
# Run Go server with auto-reload (using air or similar)
go run cmd/server/main.go -allow-all-origins
```

### Full Rebuild

After making changes to the frontend:

```bash
./build.sh
```

## 🌍 Deployment

### Using ngrok (for testing)

```bash
./server -with-ngrok -allow-all-origins
```

This will automatically start ngrok and provide a public URL.

### Environment Variables

- `ICE_SERVERS_JSON`: JSON array of ICE servers (STUN/TURN)
- `ALLOW_ALL_ORIGINS`: Set to "true" to allow all CORS origins
- `ADDR`: HTTP listen address (default `:8080`)
- `WITH_NGROK`: Set to "true" to auto-start ngrok (needs `ngrok` in PATH or `NGROK_BIN`)
- `NGROK_BIN`: Path to ngrok binary

You can also drop a `.env` file (see `.env.example`). Flags still work and override env values; env overrides defaults.

## 🔐 Security Considerations

- **E2E Encryption**: WebRTC uses DTLS-SRTP for media encryption
- **Signaling**: WebSocket signaling should be secured with TLS in production
- **CORS**: Use specific origins in production (disable `-allow-all-origins`)
- **TURN Server**: Use authenticated TURN servers for NAT traversal
- **Room IDs**: Consider using UUIDs or stronger room ID generation

## 🛠️ Configuration

### Custom ICE Servers

For better connectivity across different network configurations, configure STUN/TURN servers:

```bash
./server -ice-servers-json '[
  {"urls": "stun:stun.l.google.com:19302"},
  {"urls": "turn:your-turn-server.com:3478", "username": "user", "credential": "pass"}
]'
```

### Production Recommendations

1. Use HTTPS/WSS (TLS) for all connections
2. Configure proper TURN servers for NAT traversal
3. Implement rate limiting on WebSocket connections
4. Add authentication/authorization if needed
5. Set up monitoring and logging
6. Use a reverse proxy (nginx/Caddy) for SSL termination

## 📝 API Endpoints

- `GET /` - Serves the frontend application
- `GET /healthz` - Health check endpoint
- `GET /config` - Returns ICE server configuration and auto-generated room ID
- `GET /ws?room=<room_id>` - WebSocket endpoint for signaling

## 🤝 Contributing

This is a self-contained project. Feel free to fork and customize for your needs.

## 📄 License

This project is provided as-is for educational and self-hosting purposes.

## 🎯 Roadmap

- [ ] Screen sharing support
- [ ] Recording capabilities
- [ ] Chat functionality
- [ ] Multiple participants support
- [ ] Virtual backgrounds
- [ ] Network quality indicators
- [ ] Persistent room URLs
- [ ] Mobile app versions

## 🐛 Troubleshooting

### Video/Audio Not Working

1. Check browser permissions for camera/microphone
2. Ensure you're using HTTPS (required for WebRTC on non-localhost)
3. Check ICE server configuration
4. Look for errors in browser console

### Connection Issues

1. Check firewall settings
2. Configure TURN servers for NAT traversal
3. Verify WebSocket connection is established
4. Check network connectivity

### Build Issues

1. Ensure Node.js and Go are properly installed
2. Run `npm install` in the web directory
3. Check Go module dependencies with `go mod tidy`

## 📞 Support

For issues or questions, check the browser console for errors and the server logs for backend issues.

---

**Built with ❤️ using Go, React, and WebRTC**
