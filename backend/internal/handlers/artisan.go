// backend/internal/handlers/artisan.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"backend/internal/middleware"
	"backend/internal/models"
)

type ArtisanHandler struct {
	db *sql.DB
}

func NewArtisanHandler(db *sql.DB) *ArtisanHandler {
	return &ArtisanHandler{db: db}
}

func (h *ArtisanHandler) OnboardArtisan(w http.ResponseWriter, r *http.Request) {
	println("Error here")
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var artisan models.Artisan
	println("Error here")
	if err := json.NewDecoder(r.Body).Decode(&artisan); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}
	println("Error here")
	artisan.UserID = claims.UserID
	artisan.IsVerified = false
	println("Error here")
	err := h.db.QueryRow(`
		INSERT INTO artisans (user_id, business_name, craft_type, region, bio, verification_docs)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`, artisan.UserID, artisan.BusinessName, artisan.CraftType, artisan.Region,
		artisan.Bio, artisan.VerificationDocs).Scan(&artisan.ID, &artisan.CreatedAt)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to create artisan profile")
		return
	}

	// Update user role
	_, err = h.db.Exec("UPDATE users SET role = 'artisan' WHERE id = $1", claims.UserID)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to update user role")
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, artisan)
}

func (h *ArtisanHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var artisan models.Artisan
	if err := json.NewDecoder(r.Body).Decode(&artisan); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	_, err := h.db.Exec(`
		UPDATE artisans SET business_name = $1, bio = $2, region = $3
		WHERE user_id = $4
	`, artisan.BusinessName, artisan.Bio, artisan.Region, claims.UserID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]string{"message": "Profile updated"})
}

func (h *ArtisanHandler) GetArtisanProfile(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid artisan ID")
		return
	}

	var artisan models.Artisan
	err = h.db.QueryRow(`
		SELECT id, user_id, business_name, craft_type, region, bio, is_verified,
			   rating, total_orders, completion_rate, created_at
		FROM artisans WHERE id = $1
	`, id).Scan(&artisan.ID, &artisan.UserID, &artisan.BusinessName, &artisan.CraftType,
		&artisan.Region, &artisan.Bio, &artisan.IsVerified, &artisan.Rating,
		&artisan.TotalOrders, &artisan.CompletionRate, &artisan.CreatedAt)

	if err != nil {
		middleware.RespondError(w, http.StatusNotFound, "Artisan not found")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, artisan)
}
