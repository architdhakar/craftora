// ==================== FILE 11: backend/cmd/server/main.go ====================
package main

import (
	"log"
	"net/http"
	"os"

	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/middleware"
)

func main() {
	db, err := database.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	if err := database.CreateTables(db); err != nil {
		log.Fatal("Failed to create tables:", err)
	}

	authHandler := handlers.NewAuthHandler(db)
	productHandler := handlers.NewProductHandler(db)
	orderHandler := handlers.NewOrderHandler(db)
	artisanHandler := handlers.NewArtisanHandler(db)
	adminHandler := handlers.NewAdminHandler(db)
	reviewHandler := handlers.NewReviewHandler(db)
	aiHandler := handlers.NewAIHandler(db)
	paymentHandler := handlers.NewPaymentHandler(db)
	videoCallHandler := handlers.NewVideoCallHandler(db)

	mux := http.NewServeMux()

	// Public routes
	mux.HandleFunc("POST /api/auth/register", authHandler.Register)
	mux.HandleFunc("POST /api/auth/login", authHandler.Login)
	mux.HandleFunc("GET /api/products", productHandler.ListProducts)
	mux.HandleFunc("GET /api/products/{id}", productHandler.GetProduct)
	mux.HandleFunc("GET /api/categories", productHandler.ListCategories)
	mux.HandleFunc("GET /api/artisans/{id}", artisanHandler.GetArtisanProfile)

	// Protected routes - Buyer
	mux.HandleFunc("POST /api/orders", middleware.Auth(orderHandler.CreateOrder))
	mux.HandleFunc("GET /api/orders", middleware.Auth(orderHandler.GetUserOrders))
	mux.HandleFunc("GET /api/orders/{id}", middleware.Auth(orderHandler.GetOrderDetails))
	mux.HandleFunc("POST /api/reviews", middleware.Auth(reviewHandler.CreateReview))

	mux.HandleFunc("GET /api/products/{id}/reviews", reviewHandler.GetProductReviews)

	// Protected routes - Artisan
	mux.HandleFunc("POST /api/artisan/onboard", middleware.Auth(artisanHandler.OnboardArtisan))
	mux.HandleFunc("PUT /api/artisan/profile", middleware.Auth(middleware.ArtisanOnly(artisanHandler.UpdateProfile)))
	mux.HandleFunc("POST /api/artisan/products", middleware.Auth(middleware.ArtisanOnly(productHandler.CreateProduct)))
	mux.HandleFunc("PUT /api/artisan/products/{id}", middleware.Auth(middleware.ArtisanOnly(productHandler.UpdateProduct)))
	mux.HandleFunc("GET /api/artisan/orders", middleware.Auth(middleware.ArtisanOnly(orderHandler.GetArtisanOrders)))
	mux.HandleFunc("PUT /api/artisan/orders/{id}/status", middleware.Auth(middleware.ArtisanOnly(orderHandler.UpdateOrderStatus)))
	mux.HandleFunc("POST /api/artisan/orders/{id}/progress", middleware.Auth(middleware.ArtisanOnly(orderHandler.AddProgressUpdate)))

	// AI routes
	mux.HandleFunc("POST /api/ai/generate-story", middleware.Auth(middleware.ArtisanOnly(aiHandler.GenerateProductStory)))
	mux.HandleFunc("GET /api/ai/confidence-score/{productId}", aiHandler.GetConfidenceScore)
	mux.HandleFunc("GET /api/ai/delivery-eta/{orderId}", middleware.Auth(aiHandler.GetDeliveryETA))

	// Admin routes
	mux.HandleFunc("GET /api/admin/pending-artisans", middleware.Auth(middleware.AdminOnly(adminHandler.GetPendingArtisans)))
	mux.HandleFunc("PUT /api/admin/artisans/{id}/verify", middleware.Auth(middleware.AdminOnly(adminHandler.VerifyArtisan)))
	mux.HandleFunc("GET /api/admin/pending-products", middleware.Auth(middleware.AdminOnly(adminHandler.GetPendingProducts)))
	mux.HandleFunc("PUT /api/admin/products/{id}/approve", middleware.Auth(middleware.AdminOnly(adminHandler.ApproveProduct)))
	mux.HandleFunc("POST /api/admin/categories", middleware.Auth(middleware.AdminOnly(adminHandler.CreateCategory)))
	mux.HandleFunc("GET /api/admin/analytics", middleware.Auth(middleware.AdminOnly(adminHandler.GetAnalytics)))

	// Payment
	mux.HandleFunc("POST /api/orders/with-payment", middleware.Auth(orderHandler.CreateOrderWithPayment))
	mux.HandleFunc("GET /api/artisan/earnings", middleware.Auth(middleware.ArtisanOnly(paymentHandler.GetArtisanEarnings)))
	handler := middleware.CORS(mux)

	// Video Call
	mux.HandleFunc("POST /api/video-call/request", middleware.Auth(videoCallHandler.RequestCall))
	mux.HandleFunc("GET /api/video-call/pending", middleware.Auth(middleware.ArtisanOnly(videoCallHandler.GetPendingCalls)))
	mux.HandleFunc("PUT /api/video-call/{id}/accept", middleware.Auth(middleware.ArtisanOnly(videoCallHandler.AcceptCall)))
	mux.HandleFunc("GET /api/video-call/{id}/status", middleware.Auth(videoCallHandler.GetCallStatus))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal("Server failed:", err)
	}
}
