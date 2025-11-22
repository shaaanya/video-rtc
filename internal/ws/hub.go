package ws

import (
	"fmt"
	"sync"
	"time"
)

type Hub struct {
	rooms map[string]*Room
	mu    sync.Mutex
}

type Room struct {
	ID        string
	Peers     map[string]*Peer
	CreatedAt time.Time
	mu        sync.Mutex
}

type Peer struct {
	ID   string
	Send chan []byte
}

func NewHub() *Hub {
	h := &Hub{
		rooms: make(map[string]*Room),
	}
	go h.cleanupLoop()
	return h
}

func (h *Hub) GetOrCreateRoom(id string) *Room {
	h.mu.Lock()
	defer h.mu.Unlock()

	if room, ok := h.rooms[id]; ok {
		return room
	}

	room := &Room{
		ID:        id,
		Peers:     make(map[string]*Peer),
		CreatedAt: time.Now(),
	}
	h.rooms[id] = room
	return room
}

func (h *Hub) RemoveRoom(id string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.rooms, id)
}

func (h *Hub) cleanupLoop() {
	ticker := time.NewTicker(1 * time.Minute)
	for range ticker.C {
		h.mu.Lock()
		for id, room := range h.rooms {
			room.mu.Lock()
			if len(room.Peers) == 0 && time.Since(room.CreatedAt) > 10*time.Minute {
				delete(h.rooms, id)
			}
			room.mu.Unlock()
		}
		h.mu.Unlock()
	}
}

func (r *Room) AddPeer(p *Peer) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if len(r.Peers) >= 2 {
		return fmt.Errorf("room_full")
	}
	r.Peers[p.ID] = p
	return nil
}

func (r *Room) RemovePeer(id string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.Peers, id)
}

func (r *Room) Broadcast(senderID string, msg []byte) {
	r.mu.Lock()
	defer r.mu.Unlock()

	for id, peer := range r.Peers {
		if id != senderID {
			select {
			case peer.Send <- msg:
			default:
				close(peer.Send)
				delete(r.Peers, id)
			}
		}
	}
}
