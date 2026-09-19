package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/config"
	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/seed"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println(
			"No .env file found. Using system environment variables.",
		)
	}

	mongoClient, database, err := config.ConnectMongoDB()
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	if err := seed.Database(context.Background(), database); err != nil {
		log.Fatal("Failed to seed database:", err)
	}

	defer func() {
		if err := mongoClient.Disconnect(context.Background()); err != nil {
			log.Println("Failed to disconnect MongoDB:", err)
		}
	}()

	log.Printf(
		"Connected to MongoDB database: %s",
		database.Name(),
	)

	router := gin.Default()

	router.GET("/api/health", func(ginContext *gin.Context) {
		ginContext.JSON(http.StatusOK, gin.H{
			"success":  true,
			"message":  "Media Sequencer API is running",
			"database": database.Name(),
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on http://localhost:%s", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
