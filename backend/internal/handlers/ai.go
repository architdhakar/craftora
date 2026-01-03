// backend/internal/handlers/ai.go
package handlers

import (
	"backend/internal/middleware"
	"backend/internal/models"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
)

type AIHandler struct {
	db *sql.DB
}

func NewAIHandler(db *sql.DB) *AIHandler {
	return &AIHandler{db: db}
}

func (h *AIHandler) GenerateProductStory(w http.ResponseWriter, r *http.Request) {
	var req models.ProductStoryRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// AI-generated story (placeholder - integrate with actual AI API)
	story := "This exquisite " + req.Name + " is handcrafted by skilled artisans from " + req.Region +
		". Using traditional " + req.CraftType + " techniques passed down through generations, " +
		"each piece is meticulously created with " + req.Materials + ". " +
		"The artisan dedicates hours to ensure every detail reflects the rich cultural heritage of the region, " +
		"making each item truly one-of-a-kind. By purchasing this product, you're supporting local craftsmanship " +
		"and preserving ancient artistic traditions."

	middleware.RespondJSON(w, http.StatusOK, models.ProductStoryResponse{Story: story})
}

func (h *AIHandler) GetConfidenceScore(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("productId")
	productID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var artisanVerified bool
	var completionRate, rating float64
	var reviewCount int

	err = h.db.QueryRow(`
		SELECT a.is_verified, a.completion_rate, p.rating, p.review_count
		FROM products p
		JOIN artisans a ON p.artisan_id = a.id
		WHERE p.id = $1
	`, productID).Scan(&artisanVerified, &completionRate, &rating, &reviewCount)

	if err != nil {
		middleware.RespondError(w, http.StatusNotFound, "Product not found")
		return
	}

	// Calculate confidence score
	score := 0.0
	if artisanVerified {
		score += 40.0
	}
	score += completionRate * 0.3
	score += rating * 10.0
	if reviewCount > 10 {
		score += 10.0
	} else {
		score += float64(reviewCount)
	}

	factors := map[string]interface{}{
		"artisan_verified": artisanVerified,
		"completion_rate":  completionRate,
		"avg_rating":       rating,
		"review_count":     reviewCount,
	}

	middleware.RespondJSON(w, http.StatusOK, models.ConfidenceScoreResponse{
		Score:   score,
		Factors: factors,
	})
}

func (h *AIHandler) GetDeliveryETA(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("orderId")
	orderID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid order ID")
		return
	}

	var estimatedETA string
	var craftingTime int
	err = h.db.QueryRow(`
		SELECT o.estimated_eta, p.crafting_time
		FROM orders o
		JOIN products p ON o.product_id = p.id
		WHERE o.id = $1
	`, orderID).Scan(&estimatedETA, &craftingTime)

	if err != nil {
		middleware.RespondError(w, http.StatusNotFound, "Order not found")
		return
	}

	craftingDays := craftingTime / 24
	shippingDays := 3

	middleware.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"estimated_delivery": estimatedETA,
		"crafting_days":      craftingDays,
		"shipping_days":      shippingDays,
	})
}
