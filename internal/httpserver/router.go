package httpserver

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/user/video-rtc/internal/ws"
	"github.com/user/video-rtc/webembed"
)

type Server struct {
	Addr            string
	ICEServersJSON  string
	AllowAllOrigins bool
	Router          *chi.Mux
	Hub             *ws.Hub
}

func NewServer(addr, iceServersJSON string, allowAllOrigins bool) *http.Server {
	s := &Server{
		Addr:            addr,
		ICEServersJSON:  iceServersJSON,
		AllowAllOrigins: allowAllOrigins,
		Router:          chi.NewRouter(),
		Hub:             ws.NewHub(),
	}
	s.routes()
	return &http.Server{
		Addr:    s.Addr,
		Handler: s.Router,
	}
}

func (s *Server) routes() {
	s.Router.Use(middleware.Logger)
	s.Router.Use(middleware.Recoverer)

	s.Router.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	s.Router.Get("/config", s.handleConfig)
	s.Router.Get("/ws", s.handleWS)

	// Static assets - serve from dist directory
	distFS, err := fs.Sub(webembed.Assets, "dist")
	if err != nil {
		panic(err)
	}
	fileServer := http.FileServer(http.FS(distFS))
	s.Router.Handle("/assets/*", fileServer)
	s.Router.Handle("/vite.svg", fileServer)

	// SPA fallback
	s.Router.Get("/*", func(w http.ResponseWriter, r *http.Request) {
		// Try to serve the file first
		path := r.URL.Path
		if path != "/" {
			// Check if file exists
			if file, err := distFS.Open(path[1:]); err == nil {
				file.Close()
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// Serve index.html for all other requests
		index, err := webembed.Assets.ReadFile("dist/index.html")
		if err != nil {
			http.Error(w, "index.html not found", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/html")
		w.Write(index)
	})
}

func (s *Server) handleConfig(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	if s.AllowAllOrigins {
		w.Header().Set("Access-Control-Allow-Origin", "*")
	}

	// Default ICE servers if none provided
	ice := s.ICEServersJSON
	if ice == "" {
		ice = `[{"urls": "stun:stun.l.google.com:19302"}]`
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"iceServers": json.RawMessage(ice),
		"autoRoomId": generateRoomID(),
	})
}

func (s *Server) handleWS(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room")
	if roomID == "" {
		http.Error(w, "room required", http.StatusBadRequest)
		return
	}
	ws.HandleWS(s.Hub, w, r, roomID, s.AllowAllOrigins)
}

func generateRoomID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano()) // Simple ID for now
}
