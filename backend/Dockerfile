# Use lightweight Go image
FROM golang:1.22-alpine

# Set working directory
WORKDIR /app

# Copy module files and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the code
COPY . .

# Build the Go binary
RUN go build -o app cmd/api/main.go

# Expose the port Koyeb provides
EXPOSE 8080

# Run the binary
CMD ["./app"]
