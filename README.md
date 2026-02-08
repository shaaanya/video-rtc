# 🎥 WebRTC Video Call Application

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
