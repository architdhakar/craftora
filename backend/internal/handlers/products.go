// backend/internal/handlers/products.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"

	"backend/internal/middleware"
	"backend/internal/models"
)

type ProductHandler struct {
	db *sql.DB
}

func NewProductHandler(db *sql.DB) *ProductHandler {
	return &ProductHandler{db: db}
}

func (h *ProductHandler) ListProducts(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT p.id, p.artisan_id, p.category_id, p.name, p.description, p.ai_story,
			   p.price, p.material_cost, p.labor_cost, p.platform_fee, p.materials,
			   p.crafting_time, p.image_urls, p.stock, p.is_approved, p.rating,
			   p.review_count, p.confidence_score, p.sustainability_score,
			   p.created_at, p.updated_at,
			   a.business_name, a.craft_type, a.region, a.is_verified,
			   c.name as category_name
		FROM products p
		LEFT JOIN artisans a ON p.artisan_id = a.id
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.is_approved = true AND p.stock > 0
	`

	// Add filters
	params := []interface{}{}
	paramCount := 0

	if category := r.URL.Query().Get("category"); category != "" {
		paramCount++
		query += " AND c.slug = $" + strconv.Itoa(paramCount)
		params = append(params, category)
	}

	if region := r.URL.Query().Get("region"); region != "" {
		paramCount++
		query += " AND a.region = $" + strconv.Itoa(paramCount)
		params = append(params, region)
	}

	if craftType := r.URL.Query().Get("craft_type"); craftType != "" {
		paramCount++
		query += " AND a.craft_type = $" + strconv.Itoa(paramCount)
		params = append(params, craftType)
	}

	if search := r.URL.Query().Get("search"); search != "" {
		paramCount++
		query += " AND (p.name ILIKE '%' || $" + strconv.Itoa(paramCount) + " || '%' OR p.description ILIKE '%' || $" + strconv.Itoa(paramCount) + " || '%')"
		params = append(params, search)
	}

	if minPrice := r.URL.Query().Get("min_price"); minPrice != "" {
		paramCount++
		query += " AND p.price >= $" + strconv.Itoa(paramCount)
		params = append(params, minPrice)
	}

	if maxPrice := r.URL.Query().Get("max_price"); maxPrice != "" {
		paramCount++
		query += " AND p.price <= $" + strconv.Itoa(paramCount)
		params = append(params, maxPrice)
	}

	// Add sorting
	sortBy := r.URL.Query().Get("sort")
	switch sortBy {
	case "price_asc":
		query += " ORDER BY p.price ASC"
	case "price_desc":
		query += " ORDER BY p.price DESC"
	case "rating":
		query += " ORDER BY p.rating DESC"
	case "newest":
		query += " ORDER BY p.created_at DESC"
	default:
		query += " ORDER BY p.confidence_score DESC, p.rating DESC"
	}

	rows, err := h.db.Query(query, params...)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch products")
		return
	}
	defer rows.Close()

	products := []models.ProductWithDetails{}
	for rows.Next() {
		var p models.ProductWithDetails
		err := rows.Scan(
			&p.ID, &p.ArtisanID, &p.CategoryID, &p.Name, &p.Description, &p.AIStory,
			&p.Price, &p.MaterialCost, &p.LaborCost, &p.PlatformFee, &p.Materials,
			&p.CraftingTime, &p.ImageURLs, &p.Stock, &p.IsApproved, &p.Rating,
			&p.ReviewCount, &p.ConfidenceScore, &p.SustainabilityScore,
			&p.CreatedAt, &p.UpdatedAt,
			&p.Artisan.BusinessName, &p.Artisan.CraftType, &p.Artisan.Region, &p.Artisan.IsVerified,
			&p.CategoryName,
		)
		if err != nil {
			continue
		}
		products = append(products, p)
	}

	middleware.RespondJSON(w, http.StatusOK, products)
}

func (h *ProductHandler) GetProduct(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	var p models.ProductWithDetails
	err = h.db.QueryRow(`
		SELECT p.id, p.artisan_id, p.category_id, p.name, p.description, p.ai_story,
			   p.price, p.material_cost, p.labor_cost, p.platform_fee, p.materials,
			   p.crafting_time, p.image_urls, p.stock, p.is_approved, p.rating,
			   p.review_count, p.confidence_score, p.sustainability_score,
			   p.created_at, p.updated_at,
			   a.id, a.user_id, a.business_name, a.craft_type, a.region, a.bio,
			   a.is_verified, a.rating, a.total_orders, a.completion_rate,
			   c.name as category_name
		FROM products p
		LEFT JOIN artisans a ON p.artisan_id = a.id
		LEFT JOIN categories c ON p.category_id = c.id
		WHERE p.id = $1
	`, id).Scan(
		&p.ID, &p.ArtisanID, &p.CategoryID, &p.Name, &p.Description, &p.AIStory,
		&p.Price, &p.MaterialCost, &p.LaborCost, &p.PlatformFee, &p.Materials,
		&p.CraftingTime, &p.ImageURLs, &p.Stock, &p.IsApproved, &p.Rating,
		&p.ReviewCount, &p.ConfidenceScore, &p.SustainabilityScore,
		&p.CreatedAt, &p.UpdatedAt,
		&p.Artisan.ID, &p.Artisan.UserID, &p.Artisan.BusinessName, &p.Artisan.CraftType,
		&p.Artisan.Region, &p.Artisan.Bio, &p.Artisan.IsVerified, &p.Artisan.Rating,
		&p.Artisan.TotalOrders, &p.Artisan.CompletionRate,
		&p.CategoryName,
	)

	if err == sql.ErrNoRows {
		middleware.RespondError(w, http.StatusNotFound, "Product not found")
		return
	}
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch product")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, p)
}

func (h *ProductHandler) CreateProduct(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	// Get artisan ID
	var artisanID int
	err := h.db.QueryRow("SELECT id FROM artisans WHERE user_id = $1", claims.UserID).Scan(&artisanID)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Artisan profile not found")
		return
	}

	var product models.Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	product.ArtisanID = artisanID
	product.IsApproved = false // Requires admin approval

	err = h.db.QueryRow(`
		INSERT INTO products (artisan_id, category_id, name, description, ai_story, price,
			material_cost, labor_cost, platform_fee, materials, crafting_time, image_urls, stock)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, created_at, updated_at
	`, product.ArtisanID, product.CategoryID, product.Name, product.Description, product.AIStory,
		product.Price, product.MaterialCost, product.LaborCost, product.PlatformFee,
		product.Materials, product.CraftingTime, product.ImageURLs, product.Stock,
	).Scan(&product.ID, &product.CreatedAt, &product.UpdatedAt)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to create product")
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, product)
}

func (h *ProductHandler) UpdateProduct(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	idStr := r.PathValue("id")
	productID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid product ID")
		return
	}

	// Verify ownership
	var artisanID int
	err = h.db.QueryRow(`
		SELECT a.id FROM artisans a
		JOIN products p ON p.artisan_id = a.id
		WHERE p.id = $1 AND a.user_id = $2
	`, productID, claims.UserID).Scan(&artisanID)

	if err != nil {
		middleware.RespondError(w, http.StatusForbidden, "Not authorized to update this product")
		return
	}

	var product models.Product
	if err := json.NewDecoder(r.Body).Decode(&product); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	_, err = h.db.Exec(`
		UPDATE products SET name = $1, description = $2, price = $3, stock = $4,
			materials = $5, crafting_time = $6, updated_at = NOW()
		WHERE id = $7
	`, product.Name, product.Description, product.Price, product.Stock,
		product.Materials, product.CraftingTime, productID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to update product")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]string{"message": "Product updated successfully"})
}

func (h *ProductHandler) ListCategories(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query("SELECT id, name, slug, description, image_url FROM categories")
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch categories")
		return
	}
	defer rows.Close()

	categories := []models.Category{}
	for rows.Next() {
		var c models.Category
		if err := rows.Scan(&c.ID, &c.Name, &c.Slug, &c.Description, &c.ImageURL); err != nil {
			continue
		}
		categories = append(categories, c)
	}

	middleware.RespondJSON(w, http.StatusOK, categories)
}