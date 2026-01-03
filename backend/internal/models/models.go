// ==================== FILE 1: backend/internal/models/models.go ====================
package models

import "time"

type UserRole string

const (
	RoleBuyer   UserRole = "buyer"
	RoleArtisan UserRole = "artisan"
	RoleAdmin   UserRole = "admin"
)

type User struct {
	ID           int       `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	Name         string    `json:"name"`
	Role         UserRole  `json:"role"`
	CreatedAt    time.Time `json:"created_at"`
}

type Artisan struct {
	ID               int       `json:"id"`
	UserID           int       `json:"user_id"`
	BusinessName     string    `json:"business_name"`
	CraftType        string    `json:"craft_type"`
	Region           string    `json:"region"`
	Bio              string    `json:"bio"`
	VerificationDocs string    `json:"verification_docs"`
	IsVerified       bool      `json:"is_verified"`
	Rating           float64   `json:"rating"`
	TotalOrders      int       `json:"total_orders"`
	CompletionRate   float64   `json:"completion_rate"`
	CreatedAt        time.Time `json:"created_at"`
}

type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url"`
}

type Product struct {
	ID                  int       `json:"id"`
	ArtisanID           int       `json:"artisan_id"`
	CategoryID          int       `json:"category_id"`
	Name                string    `json:"name"`
	Description         string    `json:"description"`
	AIStory             string    `json:"ai_story"`
	Price               float64   `json:"price"`
	MaterialCost        float64   `json:"material_cost"`
	LaborCost           float64   `json:"labor_cost"`
	PlatformFee         float64   `json:"platform_fee"`
	Materials           string    `json:"materials"`
	CraftingTime        int       `json:"crafting_time"`
	ImageURLs           string    `json:"image_urls"`
	Stock               int       `json:"stock"`
	IsApproved          bool      `json:"is_approved"`
	Rating              float64   `json:"rating"`
	ReviewCount         int       `json:"review_count"`
	ConfidenceScore     float64   `json:"confidence_score"`
	SustainabilityScore int       `json:"sustainability_score"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

type ProductWithDetails struct {
	Product
	Artisan      Artisan `json:"artisan"`
	CategoryName string  `json:"category_name"`
}

type OrderStatus string

const (
	OrderPending   OrderStatus = "pending"
	OrderConfirmed OrderStatus = "confirmed"
	OrderCrafting  OrderStatus = "crafting"
	OrderShipping  OrderStatus = "shipping"
	OrderDelivered OrderStatus = "delivered"
	OrderCancelled OrderStatus = "cancelled"
)

type Order struct {
	ID              int         `json:"id"`
	UserID          int         `json:"user_id"`
	ProductID       int         `json:"product_id"`
	ArtisanID       int         `json:"artisan_id"`
	Quantity        int         `json:"quantity"`
	TotalAmount     float64     `json:"total_amount"`
	Status          OrderStatus `json:"status"`
	ShippingAddress string      `json:"shipping_address"`
	EstimatedETA    time.Time   `json:"estimated_eta"`
	CreatedAt       time.Time   `json:"created_at"`
	UpdatedAt       time.Time   `json:"updated_at"`
}

type OrderProgress struct {
	ID          int       `json:"id"`
	OrderID     int       `json:"order_id"`
	Stage       string    `json:"stage"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	CreatedAt   time.Time `json:"created_at"`
}

type Review struct {
	ID             int       `json:"id"`
	UserID         int       `json:"user_id"`
	ProductID      int       `json:"product_id"`
	OrderID        int       `json:"order_id"`
	Rating         int       `json:"rating"`
	Comment        string    `json:"comment"`
	MediaURLs      string    `json:"media_urls"`
	SentimentScore float64   `json:"sentiment_score"`
	CreatedAt      time.Time `json:"created_at"`
}

type ReviewWithUser struct {
	Review
	UserName string `json:"user_name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Email    string   `json:"email"`
	Password string   `json:"password"`
	Name     string   `json:"name"`
	Role     UserRole `json:"role"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type ProductStoryRequest struct {
	CraftType string `json:"craft_type"`
	Region    string `json:"region"`
	Materials string `json:"materials"`
	Name      string `json:"name"`
}

type ProductStoryResponse struct {
	Story string `json:"story"`
}

type ConfidenceScoreResponse struct {
	Score   float64                `json:"score"`
	Factors map[string]interface{} `json:"factors"`
}

type ETAResponse struct {
	EstimatedDelivery time.Time `json:"estimated_delivery"`
	CraftingDays      int       `json:"crafting_days"`
	ShippingDays      int       `json:"shipping_days"`
}

type Analytics struct {
	TotalArtisans   int     `json:"total_artisans"`
	TotalProducts   int     `json:"total_products"`
	TotalOrders     int     `json:"total_orders"`
	TotalRevenue    float64 `json:"total_revenue"`
	PendingArtisans int     `json:"pending_artisans"`
	PendingProducts int     `json:"pending_products"`
}
