package config

import (
	"context"
	"errors"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func ConnectMongoDB() (
	*mongo.Client,
	*mongo.Database,
	error,
) {
	mongoURI := os.Getenv("MONGODB_URI")

	if mongoURI == "" {
		return nil, nil, errors.New(
			"MONGODB_URI environment variable is required",
		)
	}

	databaseName := os.Getenv("DATABASE_NAME")
	if databaseName == "" {
		databaseName = "media_sequencer"
	}

	client, err := mongo.Connect(
		options.Client().ApplyURI(mongoURI),
	)
	if err != nil {
		return nil, nil, err
	}

	contextWithTimeout, cancel := context.WithTimeout(
		context.Background(),
		10*time.Second,
	)
	defer cancel()

	if err := client.Ping(contextWithTimeout, nil); err != nil {
		_ = client.Disconnect(context.Background())
		return nil, nil, err
	}

	database := client.Database(databaseName)

	return client, database, nil
}
