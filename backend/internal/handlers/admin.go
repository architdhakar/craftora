// ==================== FILE 10: backend/internal/handlers/admin.go ====================
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"backend/internal/middleware"
	"backend/internal/models"
)

type AdminHandler struct {
	db *sql.DB
}

func NewAdminHandler(db *sql.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

func (h *AdminHandler) GetPendingArtisans(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT id, user_id, business_name, craft_type, region, bio, verification_docs, created_at
		FROM artisans WHERE is_verified = false
		ORDER BY created_at DESC
	`)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch artisans")
		return
	}
	defer rows.Close()

	artisans := []models.Artisan{}
	for rows.Next() {
		var a models.Artisan
		if err := rows.Scan(&a.ID, &a.UserID, &a.BusinessName, &a.CraftType, &a.Region,
			&a.Bio, &a.VerificationDocs, &a.CreatedAt); err == nil {
			artisans = append(artisans, a)
		}
	}

	middleware.RespondJSON(w, http.StatusOK, artisans)
}

func (h *AdminHandler) VerifyArtisan(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	artisanID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid artisan ID")
		return
	}

	_, err = h.db.Exec("UPDATE artisans SET is_verified = true WHERE id = $1", artisanID)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to verify artisan")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]string{"message": "Artisan verified"})
}

func (h *AdminHandler) GetPendingProducts(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(`
		SELECT p.id, p.name, p.price, p.created_at, a.business_name
		FROM products p
		JOIN artisans a ON p.artisan_id = a.id
		WHERE p.is_approved = false
		ORDER BY p.created_at DESC
	`)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch products")
		return
	}
	defer rows.Close()

	type PendingProduct struct {
		ID          int     `json:"id"`
		Name        string  `json:"name"`
		Price       float64 `json:"price"`
		CreatedAt   string  `json:"created_at"`
		ArtisanName string  `json:"artisan_name"`
	}

	products := []PendingProduct{}
	for rows.Next() {
		var p PendingProduct
		if err := rows.Scan(&p.ID, &p.Name, &p.Price, &p.CreatedAt, &p.ArtisanName); err == nil {
			products = append(products, p)
		}
	}

	middleware.RespondJSON(w, http.StatusOK, products)
}

func (h *AdminHandler) ApproveProduct(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	productID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	_, err = h.db.Exec("UPDATE products SET is_approved = true WHERE id = $1", productID)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to approve product")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]string{"message": "Product approved"})
}

func (h *AdminHandler) CreateCategory(w http.ResponseWriter, r *http.Request) {
	var category models.Category
	if err := json.NewDecoder(r.Body).Decode(&category); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	err := h.db.QueryRow(`
		INSERT INTO categories (name, slug, description, image_url)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, category.Name, category.Slug, category.Description, category.ImageURL).Scan(&category.ID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to create category")
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, category)
}

func (h *AdminHandler) GetAnalytics(w http.ResponseWriter, r *http.Request) {
	var analytics models.Analytics

	h.db.QueryRow("SELECT COUNT(*) FROM artisans").Scan(&analytics.TotalArtisans)
	h.db.QueryRow("SELECT COUNT(*) FROM products WHERE is_approved = true").Scan(&analytics.TotalProducts)
	h.db.QueryRow("SELECT COUNT(*) FROM orders").Scan(&analytics.TotalOrders)
	h.db.QueryRow("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered'").Scan(&analytics.TotalRevenue)
	h.db.QueryRow("SELECT COUNT(*) FROM artisans WHERE is_verified = false").Scan(&analytics.PendingArtisans)
	h.db.QueryRow("SELECT COUNT(*) FROM products WHERE is_approved = false").Scan(&analytics.PendingProducts)

	middleware.RespondJSON(w, http.StatusOK, analytics)
}
