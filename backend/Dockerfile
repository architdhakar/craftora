FROM golang:1.25.5-alpine

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o app cmd/api/main.go

# Hugging Face exposes port 7860
EXPOSE 7860

ENV PORT=7860

CMD ["./app"]
