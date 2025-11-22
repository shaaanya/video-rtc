package ws

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/coder/websocket"
)

type Message struct {
	Type string          `json:"t"`
	Data json.RawMessage `json:"d,omitempty"`
}

func HandleWS(hub *Hub, w http.ResponseWriter, r *http.Request, roomID string, allowAllOrigins bool) {
	opts := &websocket.AcceptOptions{
		InsecureSkipVerify: allowAllOrigins,
	}
	if allowAllOrigins {
		opts.OriginPatterns = []string{"*"}
	}

	c, err := websocket.Accept(w, r, opts)
	if err != nil {
		return
	}
	var closeOnce sync.Once
	closeWith := func(code websocket.StatusCode, reason string) {
		closeOnce.Do(func() {
			_ = c.Close(code, reason)
		})
	}
	defer closeWith(websocket.StatusInternalError, "internal error")

	peerID := fmt.Sprintf("%d", time.Now().UnixNano())
	peer := &Peer{
		ID:   peerID,
		Send: make(chan []byte, 32),
	}

	room := hub.GetOrCreateRoom(roomID)
	if err := room.AddPeer(peer); err != nil {
		c.Close(websocket.StatusPolicyViolation, "room full")
		return
	}
	defer func() {
		room.RemovePeer(peerID)
		// Notify other peer
		leaveMsg, _ := json.Marshal(Message{Type: "leave"})
		room.Broadcast(peerID, leaveMsg)
		if len(room.Peers) == 0 {
			hub.RemoveRoom(roomID)
		}
	}()

	// Notify other peer about join
	joinMsg, _ := json.Marshal(Message{Type: "peer-join"})
	room.Broadcast(peerID, joinMsg)

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	// Write loop
	go func() {
		for {
			select {
			case msg, ok := <-peer.Send:
				if !ok {
					closeWith(websocket.StatusNormalClosure, "peer disconnected")
					return
				}
				if err := c.Write(ctx, websocket.MessageText, msg); err != nil {
					cancel()
					return
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	// Read loop
	for {
		_, msg, err := c.Read(ctx)
		if err != nil {
			break
		}
		// Relay message to other peer
		room.Broadcast(peerID, msg)
	}

	closeWith(websocket.StatusNormalClosure, "peer exit")
}
