// ==================== FILE 5: backend/internal/handlers/auth.go ====================
package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
	"time"

	"backend/internal/middleware"
	"backend/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	if req.Email == "" || req.Password == "" || req.Name == "" {
		middleware.RespondError(w, http.StatusBadRequest, "All fields are required")
		return
	}

	if req.Role == "" {
		req.Role = models.RoleBuyer
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	var userID int
	err = h.db.QueryRow(`
		INSERT INTO users (email, password_hash, name, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id
	`, req.Email, string(hashedPassword), req.Name, req.Role).Scan(&userID)

	if err != nil {
		middleware.RespondError(w, http.StatusConflict, "Email already exists")
		return
	}

	var user models.User
	err = h.db.QueryRow(`
		SELECT id, email, name, role, created_at
		FROM users WHERE id = $1
	`, userID).Scan(&user.ID, &user.Email, &user.Name, &user.Role, &user.CreatedAt)

	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to fetch user")
		return
	}

	token, err := h.generateToken(&user)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	middleware.RespondJSON(w, http.StatusCreated, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		middleware.RespondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	var user models.User
	err := h.db.QueryRow(`
		SELECT id, email, password_hash, name, role, created_at
		FROM users WHERE email = $1
	`, req.Email).Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Name, &user.Role, &user.CreatedAt)

	if err == sql.ErrNoRows {
		middleware.RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Database error")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		middleware.RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	token, err := h.generateToken(&user)
	if err != nil {
		middleware.RespondError(w, http.StatusInternalServerError, "Failed to generate token")
		return
	}

	middleware.RespondJSON(w, http.StatusOK, models.AuthResponse{
		Token: token,
		User:  user,
	})
}

func (h *AuthHandler) generateToken(user *models.User) (string, error) {
	claims := middleware.Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour * 7)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "your-secret-key-change-in-production"
	}

	return token.SignedString([]byte(secret))
}
