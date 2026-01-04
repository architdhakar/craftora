// ==================== FILE 2: backend/internal/database/db.go ====================
package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func InitDB() (*sql.DB, error) {
	err := godotenv.Load()
	if err != nil {
		fmt.Println("No .env file found")
	}
	dbURL := os.Getenv("DATABASE_URL")

	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL environment variable not set")
	}

	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return db, nil
}

func CreateTables(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		email VARCHAR(255) UNIQUE NOT NULL,
		password_hash VARCHAR(255) NOT NULL,
		name VARCHAR(255) NOT NULL,
		role VARCHAR(50) NOT NULL DEFAULT 'buyer',
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS artisans (
		id SERIAL PRIMARY KEY,
		user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
		business_name VARCHAR(255) NOT NULL,
		craft_type VARCHAR(100) NOT NULL,
		region VARCHAR(100) NOT NULL,
		bio TEXT,
		verification_docs TEXT,
		is_verified BOOLEAN DEFAULT FALSE,
		rating DECIMAL(3,2) DEFAULT 0,
		total_orders INTEGER DEFAULT 0,
		completion_rate DECIMAL(5,2) DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS categories (
		id SERIAL PRIMARY KEY,
		name VARCHAR(100) NOT NULL,
		slug VARCHAR(100) UNIQUE NOT NULL,
		description TEXT,
		image_url TEXT
	);

	CREATE TABLE IF NOT EXISTS products (
		id SERIAL PRIMARY KEY,
		artisan_id INTEGER REFERENCES artisans(id) ON DELETE CASCADE,
		category_id INTEGER REFERENCES categories(id),
		name VARCHAR(255) NOT NULL,
		description TEXT,
		ai_story TEXT,
		price DECIMAL(10,2) NOT NULL,
		material_cost DECIMAL(10,2),
		labor_cost DECIMAL(10,2),
		platform_fee DECIMAL(10,2),
		materials TEXT,
		crafting_time INTEGER,
		image_urls TEXT,
		stock INTEGER DEFAULT 0,
		is_approved BOOLEAN DEFAULT FALSE,
		rating DECIMAL(3,2) DEFAULT 0,
		review_count INTEGER DEFAULT 0,
		confidence_score DECIMAL(5,2) DEFAULT 0,
		sustainability_score INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS orders (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		product_id INTEGER REFERENCES products(id),
		artisan_id INTEGER REFERENCES artisans(id),
		quantity INTEGER NOT NULL,
		total_amount DECIMAL(10,2) NOT NULL,
		status VARCHAR(50) NOT NULL DEFAULT 'pending',
		shipping_address TEXT NOT NULL,
		estimated_eta TIMESTAMP,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS order_progress (
		id SERIAL PRIMARY KEY,
		order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
		stage VARCHAR(100) NOT NULL,
		description TEXT,
		image_url TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS reviews (
		id SERIAL PRIMARY KEY,
		user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
		product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
		order_id INTEGER REFERENCES orders(id),
		rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
		comment TEXT,
		media_urls TEXT,
		sentiment_score DECIMAL(5,2),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS payments (
	id SERIAL PRIMARY KEY,
	order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
	amount DECIMAL(10,2) NOT NULL,
	platform_fee DECIMAL(10,2) NOT NULL,
	artisan_amount DECIMAL(10,2) NOT NULL,
	payment_method VARCHAR(50) DEFAULT 'demo',
	payment_status VARCHAR(50) DEFAULT 'pending',
	transaction_id VARCHAR(255),
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	CREATE TABLE IF NOT EXISTS video_call_requests (
	id SERIAL PRIMARY KEY,
	buyer_id INTEGER REFERENCES users(id),
	artisan_id INTEGER REFERENCES artisans(id),
	product_id INTEGER REFERENCES products(id),
	room_name VARCHAR(255) NOT NULL,
	status VARCHAR(50) DEFAULT 'pending',
	created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

	CREATE INDEX IF NOT EXISTS idx_products_artisan ON products(artisan_id);
	CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
	CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
	CREATE INDEX IF NOT EXISTS idx_orders_artisan ON orders(artisan_id);
	CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
	`

	_, err := db.Exec(schema)
	return err
}
