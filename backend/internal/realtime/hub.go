package realtime

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Message struct {
	Type string `json:"type"`
	Data any    `json:"data"`
}

type Hub struct {
	clients  map[*websocket.Conn]struct{}
	mutex    sync.Mutex
	upgrader websocket.Upgrader
}

func NewHub(frontendURL string) *Hub {
	allowedOrigin := strings.TrimRight(frontendURL, "/")

	return &Hub{
		clients: make(map[*websocket.Conn]struct{}),
		upgrader: websocket.Upgrader{
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
			CheckOrigin: func(request *http.Request) bool {
				origin := strings.TrimRight(
					request.Header.Get("Origin"),
					"/",
				)

				return origin == "" ||
					origin == allowedOrigin ||
					origin == "http://localhost:5173"
			},
		},
	}
}

func (hub *Hub) ServeWS(c *gin.Context) {
	connection, err := hub.upgrader.Upgrade(
		c.Writer,
		c.Request,
		nil,
	)
	if err != nil {
		return
	}

	hub.mutex.Lock()
	hub.clients[connection] = struct{}{}
	hub.mutex.Unlock()

	defer func() {
		hub.mutex.Lock()
		delete(hub.clients, connection)
		hub.mutex.Unlock()

		_ = connection.Close()
	}()

	for {
		if _, _, err := connection.ReadMessage(); err != nil {
			return
		}
	}
}

func (hub *Hub) Broadcast(message Message) {
	hub.mutex.Lock()
	defer hub.mutex.Unlock()

	for connection := range hub.clients {
		_ = connection.SetWriteDeadline(
			time.Now().Add(3 * time.Second),
		)

		if err := connection.WriteJSON(message); err != nil {
			_ = connection.Close()
			delete(hub.clients, connection)
		}
	}
}
