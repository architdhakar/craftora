// FILE: backend/internal/handlers/video_call.go (NEW FILE)
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"backend/internal/middleware"
)

type VideoCallHandler struct {
	db *sql.DB
}

func NewVideoCallHandler(db *sql.DB) *VideoCallHandler {
	return &VideoCallHandler{db: db}
}

type VideoCallRequest struct {
	ID          int       `json:"id"`
	BuyerID     int       `json:"buyer_id"`
	ArtisanID   int       `json:"artisan_id"`
	ProductID   int       `json:"product_id"`
	RoomName    string    `json:"room_name"`
	Status      string    `json:"status"` // pending, accepted, rejected, completed
	BuyerName   string    `json:"buyer_name"`
	ProductName string    `json:"product_name"`
	CreatedAt   time.Time `json:"created_at"`
}

// Buyer requests a video call
func (h *VideoCallHandler) RequestCall(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var req struct {
		ProductID int `json:"product_id"`
		ArtisanID int `json:"artisan_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	roomName := fmt.Sprintf("Artisan-Call-%d-%d-%d", req.ProductID, req.ArtisanID, time.Now().Unix())

	var callID int
	err := h.db.QueryRow(`
		INSERT INTO video_call_requests (buyer_id, artisan_id, product_id, room_name, status)
		VALUES ($1, $2, $3, $4, 'pending')
		RETURNING id
	`, claims.UserID, req.ArtisanID, req.ProductID, roomName).Scan(&callID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to create call request")
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"id":        callID,
		"room_name": roomName,
		"status":    "pending",
	})
}

// Artisan gets pending call requests
func (h *VideoCallHandler) GetPendingCalls(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var artisanID int
	err := h.db.QueryRow("SELECT id FROM artisans WHERE user_id = $1", claims.UserID).Scan(&artisanID)
	if err != nil {
		middleware.RespondError(w, http.StatusNotFound, "Artisan profile not found")
		return
	}

	rows, err := h.db.Query(`
		SELECT v.id, v.buyer_id, v.artisan_id, v.product_id, v.room_name, v.status, 
		       u.name as buyer_name, p.name as product_name, v.created_at
		FROM video_call_requests v
		JOIN users u ON v.buyer_id = u.id
		JOIN products p ON v.product_id = p.id
		WHERE v.artisan_id = $1 AND v.status = 'pending'
		ORDER BY v.created_at DESC
	`, artisanID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch requests")
		return
	}
	defer rows.Close()

	requests := []VideoCallRequest{}
	for rows.Next() {
		var req VideoCallRequest
		rows.Scan(&req.ID, &req.BuyerID, &req.ArtisanID, &req.ProductID, &req.RoomName,
			&req.Status, &req.BuyerName, &req.ProductName, &req.CreatedAt)
		requests = append(requests, req)
	}

	middleware.RespondJSON(w, http.StatusOK, requests)
}

// Artisan accepts call
func (h *VideoCallHandler) AcceptCall(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	callID := r.PathValue("id")

	_, err := h.db.Exec(`
		UPDATE video_call_requests 
		SET status = 'accepted'
		WHERE id = $1 AND artisan_id IN (SELECT id FROM artisans WHERE user_id = $2)
	`, callID, claims.UserID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to accept call")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]string{"status": "accepted"})
}

// Check call status (for buyer polling)
func (h *VideoCallHandler) GetCallStatus(w http.ResponseWriter, r *http.Request) {
	callID := r.PathValue("id")

	var status, roomName string
	err := h.db.QueryRow(`
		SELECT status, room_name FROM video_call_requests WHERE id = $1
	`, callID).Scan(&status, &roomName)

	if err != nil {
		middleware.RespondError(w, http.StatusNotFound, "Call request not found")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]string{
		"status":    status,
		"room_name": roomName,
	})
}
