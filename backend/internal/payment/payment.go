package payment

import (
	"errors"
	"math/rand"
	"time"
)

func ProcessPayment(amount float64) error {
	// Simulate network delay to the bank (1 second)
	time.Sleep(1 * time.Second)

	// Simulate a 90% success rate
	rand.Seed(time.Now().UnixNano())
	if rand.Float32() < 0.1 {
		return errors.New("payment failed: insufficient funds")
	}

	return nil // Payment successful
}
