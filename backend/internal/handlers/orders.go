// backend/internal/handlers/orders.go
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"backend/internal/middleware"
	"backend/internal/models"
)

type OrderHandler struct {
	db *sql.DB
}

func NewOrderHandler(db *sql.DB) *OrderHandler {
	return &OrderHandler{db: db}
}

func (h *OrderHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var order models.Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Get product details
	var price float64
	var artisanID, craftingTime int
	err := h.db.QueryRow(`
		SELECT price, artisan_id, crafting_time FROM products
		WHERE id = $1 AND is_approved = true AND stock >= $2
	`, order.ProductID, order.Quantity).Scan(&price, &artisanID, &craftingTime)

	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Product not available")
		return
	}

	order.UserID = claims.UserID
	order.ArtisanID = artisanID
	order.TotalAmount = price * float64(order.Quantity)
	order.Status = models.OrderPending

	// Calculate ETA (crafting time + 3 days shipping)
	order.EstimatedETA = time.Now().Add(time.Duration(craftingTime)*time.Hour + 72*time.Hour)

	// Insert order
	err = h.db.QueryRow(`
		INSERT INTO orders (user_id, product_id, artisan_id, quantity, total_amount, status, shipping_address, estimated_eta)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at, updated_at
	`, order.UserID, order.ProductID, order.ArtisanID, order.Quantity, order.TotalAmount,
		order.Status, order.ShippingAddress, order.EstimatedETA,
	).Scan(&order.ID, &order.CreatedAt, &order.UpdatedAt)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to create order")
		return
	}

	// Update product stock
	_, err = h.db.Exec("UPDATE products SET stock = stock - $1 WHERE id = $2", order.Quantity, order.ProductID)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to update stock")
		return
	}

	// Add initial progress
	_, err = h.db.Exec(`
		INSERT INTO order_progress (order_id, stage, description)
		VALUES ($1, $2, $3)
	`, order.ID, "Order Placed", "Your order has been received and is awaiting confirmation")

	middleware.RespondJSON(w, http.StatusCreated, order)
}

func (h *OrderHandler) GetUserOrders(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	rows, err := h.db.Query(`
		SELECT o.id, o.user_id, o.product_id, o.artisan_id, o.quantity, o.total_amount,
			   o.status, o.shipping_address, o.estimated_eta, o.created_at, o.updated_at,
			   p.name, p.image_urls, p.price,
			   a.business_name
		FROM orders o
		JOIN products p ON o.product_id = p.id
		JOIN artisans a ON o.artisan_id = a.id
		WHERE o.user_id = $1
		ORDER BY o.created_at DESC
	`, claims.UserID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}
	defer rows.Close()

	type OrderWithDetails struct {
		models.Order
		ProductName  string  `json:"product_name"`
		ProductImage string  `json:"product_image"`
		ProductPrice float64 `json:"product_price"`
		ArtisanName  string  `json:"artisan_name"`
	}

	orders := []OrderWithDetails{}
	for rows.Next() {
		var o OrderWithDetails
		err := rows.Scan(
			&o.ID, &o.UserID, &o.ProductID, &o.ArtisanID, &o.Quantity, &o.TotalAmount,
			&o.Status, &o.ShippingAddress, &o.EstimatedETA, &o.CreatedAt, &o.UpdatedAt,
			&o.ProductName, &o.ProductImage, &o.ProductPrice, &o.ArtisanName,
		)
		if err != nil {
			continue
		}
		orders = append(orders, o)
	}

	middleware.RespondJSON(w, http.StatusOK, orders)
}

func (h *OrderHandler) GetOrderDetails(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	idStr := r.PathValue("id")
	orderID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid order ID")
		return
	}

	type OrderDetails struct {
		models.Order
		ProductName  string                 `json:"product_name"`
		ProductImage string                 `json:"product_image"`
		ArtisanName  string                 `json:"artisan_name"`
		Progress     []models.OrderProgress `json:"progress"`
	}

	var order OrderDetails
	err = h.db.QueryRow(`
		SELECT o.id, o.user_id, o.product_id, o.artisan_id, o.quantity, o.total_amount,
			   o.status, o.shipping_address, o.estimated_eta, o.created_at, o.updated_at,
			   p.name, p.image_urls, a.business_name
		FROM orders o
		JOIN products p ON o.product_id = p.id
		JOIN artisans a ON o.artisan_id = a.id
		WHERE o.id = $1 AND o.user_id = $2
	`, orderID, claims.UserID).Scan(
		&order.ID, &order.UserID, &order.ProductID, &order.ArtisanID, &order.Quantity,
		&order.TotalAmount, &order.Status, &order.ShippingAddress, &order.EstimatedETA,
		&order.CreatedAt, &order.UpdatedAt, &order.ProductName, &order.ProductImage, &order.ArtisanName,
	)

	if err != nil {
		middleware.RespondError(w, http.StatusNotFound, "Order not found")
		return
	}

	// Get progress
	rows, err := h.db.Query(`
		SELECT id, order_id, stage, description, image_url, created_at
		FROM order_progress WHERE order_id = $1 ORDER BY created_at ASC
	`, orderID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p models.OrderProgress
			if err := rows.Scan(&p.ID, &p.OrderID, &p.Stage, &p.Description, &p.ImageURL, &p.CreatedAt); err == nil {
				order.Progress = append(order.Progress, p)
			}
		}
	}

	middleware.RespondJSON(w, http.StatusOK, order)
}

func (h *OrderHandler) GetArtisanOrders(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var artisanID int
	err := h.db.QueryRow("SELECT id FROM artisans WHERE user_id = $1", claims.UserID).Scan(&artisanID)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Artisan profile not found")
		return
	}

	rows, err := h.db.Query(`
		SELECT o.id, o.user_id, o.product_id, o.artisan_id, o.quantity, o.total_amount,
			   o.status, o.shipping_address, o.estimated_eta, o.created_at, o.updated_at,
			   p.name, u.name as buyer_name
		FROM orders o
		JOIN products p ON o.product_id = p.id
		JOIN users u ON o.user_id = u.id
		WHERE o.artisan_id = $1
		ORDER BY o.created_at DESC
	`, artisanID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch orders")
		return
	}
	defer rows.Close()

	type ArtisanOrderView struct {
		models.Order
		ProductName string `json:"product_name"`
		BuyerName   string `json:"buyer_name"`
	}

	orders := []ArtisanOrderView{}
	for rows.Next() {
		var o ArtisanOrderView
		err := rows.Scan(
			&o.ID, &o.UserID, &o.ProductID, &o.ArtisanID, &o.Quantity, &o.TotalAmount,
			&o.Status, &o.ShippingAddress, &o.EstimatedETA, &o.CreatedAt, &o.UpdatedAt,
			&o.ProductName, &o.BuyerName,
		)
		if err != nil {
			continue
		}
		orders = append(orders, o)
	}

	middleware.RespondJSON(w, http.StatusOK, orders)
}

func (h *OrderHandler) UpdateOrderStatus(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	idStr := r.PathValue("id")
	orderID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid order ID")
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Verify artisan owns this order
	var artisanID int
	err = h.db.QueryRow("SELECT id FROM artisans WHERE user_id = $1", claims.UserID).Scan(&artisanID)
	if err != nil {
		middleware.RespondError(w, http.StatusForbidden, "Not authorized")
		return
	}

	_, err = h.db.Exec(`
		UPDATE orders SET status = $1, updated_at = NOW()
		WHERE id = $2 AND artisan_id = $3
	`, req.Status, orderID, artisanID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to update order")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, map[string]string{"message": "Order status updated"})
}

func (h *OrderHandler) AddProgressUpdate(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)
	idStr := r.PathValue("id")
	orderID, err := strconv.Atoi(idStr)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid order ID")
		return
	}

	var progress models.OrderProgress
	if err := json.NewDecoder(r.Body).Decode(&progress); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Verify artisan owns this order
	var artisanID int
	err = h.db.QueryRow("SELECT id FROM artisans WHERE user_id = $1", claims.UserID).Scan(&artisanID)
	if err != nil {
		middleware.RespondError(w, http.StatusForbidden, "Not authorized")
		return
	}

	var orderArtisanID int
	err = h.db.QueryRow("SELECT artisan_id FROM orders WHERE id = $1", orderID).Scan(&orderArtisanID)
	if err != nil || orderArtisanID != artisanID {
		middleware.RespondError(w, http.StatusForbidden, "Not authorized")
		return
	}

	err = h.db.QueryRow(`
		INSERT INTO order_progress (order_id, stage, description, image_url)
		VALUES ($1, $2, $3, $4)
		RETURNING id, created_at
	`, orderID, progress.Stage, progress.Description, progress.ImageURL).Scan(&progress.ID, &progress.CreatedAt)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to add progress")
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, progress)
}

// Add this function
/*
func (h *OrderHandler) AutoUpdateOrderStatus() {
	// This would be called by a cron job or background worker
	// For demo, we'll simulate it

	ticker := time.NewTicker(2 * time.Hour)
	defer ticker.Stop()

	statuses := []models.OrderStatus{
		models.OrderConfirmed,
		"packed",
		"on_the_way",
		"out_for_delivery",
		models.OrderDelivered,
	}

	for range ticker.C {
		// Get all non-delivered orders
		rows, err := h.db.Query(`
			SELECT id, status, created_at
			FROM orders
			WHERE status != 'delivered' AND status != 'cancelled'
		`)
		if err != nil {
			continue
		}
		defer rows.Close()

		for rows.Next() {
			var orderID int
			var currentStatus string
			var createdAt time.Time
			rows.Scan(&orderID, &currentStatus, &createdAt)

			hoursSinceCreation := time.Since(createdAt).Hours()

			var newStatus string
			var description string

			if hoursSinceCreation > 72 { // 3 days
				newStatus = "delivered"
				description = "Order delivered successfully!"
			} else if hoursSinceCreation > 48 {
				newStatus = "out_for_delivery"
				description = "Out for delivery to your address"
			} else if hoursSinceCreation > 24 {
				newStatus = "on_the_way"
				description = "Package is on the way"
			} else if hoursSinceCreation > 4 {
				newStatus = "packed"
				description = "Order packed and ready to ship"
			}

			if newStatus != "" && newStatus != currentStatus {
				// Update order status
				h.db.Exec(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, newStatus, orderID)

				// Add progress update
				h.db.Exec(`
					INSERT INTO order_progress (order_id, stage, description)
					VALUES ($1, $2, $3)
				`, orderID, newStatus, description)
			}
		}
	}
}
*/
