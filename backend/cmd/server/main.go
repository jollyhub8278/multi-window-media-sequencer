package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/config"
	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/handlers"
	"github.com/jollyhub8278/multi-window-media-sequencer/backend/internal/repository"
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

	defer func() {
		if err := mongoClient.Disconnect(context.Background()); err != nil {
			log.Println("Failed to disconnect MongoDB:", err)
		}
	}()

	log.Printf(
		"Connected to MongoDB database: %s",
		database.Name(),
	)

	if err := seed.Database(context.Background(), database); err != nil {
		log.Fatal("Failed to seed database:", err)
	}

	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:5173"
	}

	router := gin.Default()

	if err := router.SetTrustedProxies(nil); err != nil {
		log.Fatal("Failed to configure trusted proxies:", err)
	}

	router.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			frontendURL,
		},
		AllowMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
		},
		MaxAge: 12 * time.Hour,
	}))

	dataRepository := repository.New(database)
	apiHandler := handlers.NewAPIHandler(dataRepository)

	api := router.Group("/api")

	api.GET("/health", func(ginContext *gin.Context) {
		ginContext.JSON(http.StatusOK, gin.H{
			"success":  true,
			"message":  "Media Sequencer API is running",
			"database": database.Name(),
		})
	})

	api.GET("/media", apiHandler.GetMedia)
	api.GET("/windows", apiHandler.GetWindows)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server running on http://localhost:%s", port)

	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
