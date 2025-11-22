#!/bin/bash

set -e

echo "🎬 Building WebRTC Video Call Application..."

echo ""
echo "📦 Step 1: Building frontend..."
cd web
npm run build
cd ..

echo ""
echo "📋 Step 2: Copying assets to webembed..."
rsync -av --delete web/dist/ webembed/dist/

echo ""
echo "🔨 Step 3: Building Go server..."
go build -o server ./cmd/server

echo ""
echo "✅ Build complete!"
echo ""
echo "🚀 To run the server:"
echo "   ./server -addr :8080 -allow-all-origins"
echo ""
echo "🌐 Then open http://localhost:8080 in your browser"
