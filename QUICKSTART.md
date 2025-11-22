# 🚀 Quick Start Guide

## Prerequisites

- Go 1.25.2+
- Node.js 18+
- Modern web browser

## 1. Initial Setup

```bash
# Clone or navigate to the project
cd video-rtc

# Install frontend dependencies
cd web
npm install
cd ..
```

## 2. Build the Application

```bash
# Option A: Use the build script (recommended)
./build.sh

# Option B: Manual build
cd web && npm run build && cd ..
rsync -av --delete web/dist/ webembed/dist/
go build -o server ./cmd/server
```

## 3. Run the Server

```bash
# Basic usage
./server

# Custom port
./server -addr :3000

# Development mode (allow all CORS)
./server -allow-all-origins

# With ngrok for external access
./server -with-ngrok -allow-all-origins
```

## 4. Access the Application

Open your browser and go to:
```
http://localhost:8080
```

## 5. Start a Call

1. **First user**: Open the app - you'll see a random room ID
2. **Share** the room ID with the other person
3. **Second user**: Enter the same room ID and click "Join Room"
4. **Grant permissions** when your browser asks for camera/microphone access
5. **Start calling!** The connection will establish automatically

## 🎥 Features

- **🎤 Mute/Unmute**: Control your microphone
- **📹 Camera On/Off**: Toggle your video
- **❌ Hangup**: End the call and return to lobby

## 🔧 Troubleshooting

### "Camera/Microphone not accessible"
- Check browser permissions (usually shows an icon in the address bar)
- Make sure no other app is using your camera
- If on localhost, ensure you're using `http://localhost` not `http://127.0.0.1`

### "Peer not connecting"
- Both users must be in the same room
- Check if both browsers support WebRTC (Chrome, Firefox, Safari, Edge are supported)
- For connections across different networks, you may need TURN servers

### "Page not loading"
- Make sure the server is running
- Check the server logs for errors
- Try rebuilding: `./build.sh`

## 🌐 Deployment

### Quick Deploy with ngrok

```bash
./server -with-ngrok -allow-all-origins
```

This will start ngrok and give you a public URL you can share.

### Production Deploy

See the main README.md for production configuration.

## 💡 Tips

- **Room IDs** are automatically generated but you can enter any custom room ID
- **Share the URL** with `?r=ROOM_ID` parameter to make joining easier
- **Use HTTPS** in production for WebRTC to work properly
- **Configure TURN servers** for better connectivity across different networks

## 📝 Environment Variables

```bash
# Set custom ICE servers
export ICE_SERVERS_JSON='[{"urls":"stun:stun.l.google.com:19302"}]'

# Allow all origins (development only!)
export ALLOW_ALL_ORIGINS=true

./server
```

## 🎨 Development Mode

```bash
# Terminal 1: Run the backend
./server -allow-all-origins

# Terminal 2: Run frontend dev server with hot reload
cd web
npm run dev
```

Then open http://localhost:5173 for frontend development with hot reload.

## ⚡ Quick Rebuild

After making frontend changes:

```bash
./build.sh
# The server will automatically restart if you're using air or similar
# Otherwise, restart manually: Ctrl+C then ./server
```

## 🔐 Security Notes

For production:
- Always use HTTPS
- Remove `-allow-all-origins` flag
- Configure proper CORS origins
- Use authenticated TURN servers
- Consider adding room passwords or user authentication

---

**Happy calling! 🎉**
