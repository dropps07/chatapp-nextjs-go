package chat

import (
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Message struct {
	SenderID    string    `json:"sender"`
	ReceiversID string `json:"receiver"`
	Content     string     `json:"content"`

}

// mapping over the clients and sending the message
// using mutex for concurrent synchronization between clients and msgs
var (
	clients = make(map[string]*websocket.Conn)
	mutex   = sync.Mutex{}
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
)

// starting the chat server, as long as it is running handleConnections will be called
func StartChat() {
	http.HandleFunc("/ws", handleConnections)

	log.Println("Server started on :8080")
	err:= http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe: ", err)
	}
}

// handleConnections upgrades incoming http to websocket connections for real-time updates
func handleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal(err)
	}
	defer ws.Close()

	//fetching userID on local host server and storing it in userID  
	var userID string 
	userID = r.URL.Query().Get("userID")
	if userID == "" {
		log.Println("No UserID Provided!, Connection refused.")
	}

	//connecting userID to websockets
	mutex.Lock()        //modifying the clients map
	clients[userID] = ws
	mutex.Unlock()      //accessing the clients map

	log.Println("User is Connected.", userID)
	// infinite loop to read real-time messages by cleints and updating it as long as server is alive
	for{
		var msg Message
		err:= ws.ReadJSON(&msg)

		if err != nil {
			log.Println("Error reading the message: %v\n", err)
			mutex.Lock()
			delete(clients, userID)
			mutex.Unlock()
			break
		}
		log.Println("Successfully recieved the message: ", msg)
		sendMessageToReciever(msg)
	}
}

func sendMessageToReciever(msg Message) {
	//looking fo recievers websocket connection
	mutex.Lock()
	receiver, found := clients[msg.ReceiversID]
	mutex.Unlock()
	
	if !found {
		log.Println("Receiver is not connected.")
		return
	}
	err:= receiver.WriteJSON(msg)
	if err != nil {
		log.Println("Error writing the message to reciever: %v\n", err)

		mutex.Lock()
		delete(clients, msg.ReceiversID)
		mutex.Unlock()
	}
}
