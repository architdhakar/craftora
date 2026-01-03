// backend/internal/handlers/review.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"backend/internal/middleware"
	"backend/internal/models"
)

type ReviewHandler struct {
	db *sql.DB
}

func NewReviewHandler(db *sql.DB) *ReviewHandler {
	return &ReviewHandler{db: db}
}

func (h *ReviewHandler) CreateReview(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var review models.Review
	if err := json.NewDecoder(r.Body).Decode(&review); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	review.UserID = claims.UserID

	// Simple sentiment score calculation
	review.SentimentScore = float64(review.Rating) * 20.0

	err := h.db.QueryRow(`
		INSERT INTO reviews (user_id, product_id, order_id, rating, comment, media_urls, sentiment_score)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at
	`, review.UserID, review.ProductID, review.OrderID, review.Rating,
		review.Comment, review.MediaURLs, review.SentimentScore).Scan(&review.ID, &review.CreatedAt)
	fmt.Println("DB error:", err.Error())
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to create review")
		return
	}

	// Update product rating
	h.db.Exec(`
		UPDATE products SET 
			rating = (SELECT AVG(rating) FROM reviews WHERE product_id = $1),
			review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = $1)
		WHERE id = $1
	`, review.ProductID)

	middleware.RespondJSON(w, http.StatusCreated, review)
}

func (h *ReviewHandler) GetProductReviews(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	productID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	rows, err := h.db.Query(`
		SELECT r.id, r.user_id, r.product_id, r.order_id, r.rating, r.comment,
			   r.media_urls, r.sentiment_score, r.created_at, u.name
		FROM reviews r
		JOIN users u ON r.user_id = u.id
		WHERE r.product_id = $1
		ORDER BY r.created_at DESC
	`, productID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch reviews")
		return
	}
	defer rows.Close()

	reviews := []models.ReviewWithUser{}
	for rows.Next() {
		var r models.ReviewWithUser
		if err := rows.Scan(&r.ID, &r.UserID, &r.ProductID, &r.OrderID, &r.Rating,
			&r.Comment, &r.MediaURLs, &r.SentimentScore, &r.CreatedAt, &r.UserName); err == nil {
			reviews = append(reviews, r)
		}
	}

	middleware.RespondJSON(w, http.StatusOK, reviews)
}
