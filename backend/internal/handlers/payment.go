// ==================== backend/internal/handlers/payment.go ====================
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"backend/internal/middleware"
)

type PaymentHandler struct {
	db *sql.DB
}

func NewPaymentHandler(db *sql.DB) *PaymentHandler {
	return &PaymentHandler{db: db}
}

// CreateOrderWithPayment handles the complete payment flow with transaction
func (h *OrderHandler) CreateOrderWithPayment(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var req struct {
		ProductID       int    `json:"product_id"`
		Quantity        int    `json:"quantity"`
		ShippingAddress string `json:"shipping_address"`
		PaymentMethod   string `json:"payment_method"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	// Start transaction
	tx, err := h.db.Begin()
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to start transaction")
		return
	}
	defer tx.Rollback() // Will be ignored if tx.Commit() succeeds

	// Get product details with row locking
	var price float64
	var artisanID, craftingTime, stock int
	var productName string
	err = tx.QueryRow(`
		SELECT price, artisan_id, crafting_time, stock, name FROM products
		WHERE id = $1 AND is_approved = true
		FOR UPDATE
	`, req.ProductID).Scan(&price, &artisanID, &craftingTime, &stock, &productName)

	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Product not available")
		return
	}

	// Check stock
	if stock < req.Quantity {
		middleware.RespondError(w, http.StatusBadRequest, "Insufficient stock")
		return
	}

	totalAmount := price * float64(req.Quantity)
	platformFee := totalAmount * 0.1
	artisanAmount := totalAmount - platformFee

	// Create order
	var orderID int
	estimatedETA := time.Now().Add(time.Duration(craftingTime)*time.Hour + 72*time.Hour)

	err = tx.QueryRow(`
		INSERT INTO orders (user_id, product_id, artisan_id, quantity, total_amount, 
			status, shipping_address, estimated_eta)
		VALUES ($1, $2, $3, $4, $5, 'confirmed', $6, $7)
		RETURNING id
	`, claims.UserID, req.ProductID, artisanID, req.Quantity, totalAmount,
		req.ShippingAddress, estimatedETA).Scan(&orderID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to create order")
		return
	}

	// Update product stock
	_, err = tx.Exec(`
		UPDATE products SET stock = stock - $1 
		WHERE id = $2
	`, req.Quantity, req.ProductID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to update stock")
		return
	}

	// Record payment transaction
	_, err = tx.Exec(`
		INSERT INTO payments (order_id, amount, platform_fee, artisan_amount, 
			payment_method, payment_status, transaction_id)
		VALUES ($1, $2, $3, $4, $5, 'completed', $6)
	`, orderID, totalAmount, platformFee, artisanAmount, req.PaymentMethod,
		fmt.Sprintf("TXN_%d_%d", orderID, time.Now().Unix()))

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to record payment")
		return
	}

	// Add initial progress
	_, err = tx.Exec(`
		INSERT INTO order_progress (order_id, stage, description)
		VALUES ($1, 'Order Confirmed', 'Payment received. Order is being prepared.')
	`, orderID)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to add progress")
		return
	}

	// Update artisan stats
	_, err = tx.Exec(`
		UPDATE artisans SET 
			total_orders = total_orders + 1
		WHERE id = $1
	`, artisanID)

	// Commit transaction
	if err := tx.Commit(); err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to complete order")
		return
	}

	// Success response
	middleware.RespondJSON(w, http.StatusCreated, map[string]interface{}{
		"order_id":       orderID,
		"total_amount":   totalAmount,
		"artisan_amount": artisanAmount,
		"platform_fee":   platformFee,
		"message":        "Order placed successfully!",
		"estimated_eta":  estimatedETA,
	})
}

// GetArtisanEarnings returns the artisan's earnings
func (h *PaymentHandler) GetArtisanEarnings(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.UserContextKey).(*middleware.Claims)

	var artisanID int
	err := h.db.QueryRow("SELECT id FROM artisans WHERE user_id = $1", claims.UserID).Scan(&artisanID)
	if err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Artisan profile not found")
		return
	}

	var totalEarnings, pendingAmount, completedAmount float64
	var totalOrders, pendingOrders, completedOrders int

	// Total earnings from all orders
	h.db.QueryRow(`
		SELECT COALESCE(SUM(p.artisan_amount), 0), COUNT(*)
		FROM payments p
		JOIN orders o ON p.order_id = o.id
		WHERE o.artisan_id = $1 AND p.payment_status = 'completed'
	`, artisanID).Scan(&totalEarnings, &totalOrders)

	// Pending orders
	h.db.QueryRow(`
		SELECT COALESCE(SUM(p.artisan_amount), 0), COUNT(*)
		FROM payments p
		JOIN orders o ON p.order_id = o.id
		WHERE o.artisan_id = $1 AND o.status IN ('confirmed', 'crafting', 'shipping')
	`, artisanID).Scan(&pendingAmount, &pendingOrders)

	// Completed orders
	h.db.QueryRow(`
		SELECT COALESCE(SUM(p.artisan_amount), 0), COUNT(*)
		FROM payments p
		JOIN orders o ON p.order_id = o.id
		WHERE o.artisan_id = $1 AND o.status = 'delivered'
	`, artisanID).Scan(&completedAmount, &completedOrders)

	middleware.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"total_earnings":    totalEarnings,
		"completed_amount":  completedAmount,
		"pending_amount":    pendingAmount,
		"total_orders":      totalOrders,
		"completed_orders":  completedOrders,
		"pending_orders":    pendingOrders,
		"platform_fee_rate": 0.1,
	})
}
